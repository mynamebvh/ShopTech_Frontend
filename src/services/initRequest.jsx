import axios from "axios";

// actions
import { setLoading } from "actions/app.action";

function getAccessToken() {
  const accessToken = window.localStorage.getItem("accessToken");
  return accessToken;
}

const requestConfig = {
  baseURL: process.env.REACT_APP_ENDPOINT_URL,
  timeout: 5000,
  showSpinner: false,
};

export const axiosInstance = axios.create(requestConfig);

const { CancelToken } = axios;
let cancel = null;

export default function initRequest(store) {
  let requestCount = 0;

  function decreaseRequestCount() {
    requestCount -= 1;
    if (requestCount === 0) {
      store.dispatch(setLoading(false));
    }
  }

  axiosInstance.interceptors.request.use(
    (config) => {
      // cancel token
      if (cancel) {
        cancel(); // cancel request
      }
      config.cancelToken = new CancelToken(function executor(c) {
        cancel = c;
      });

      // show loading
      if (config.showSpinner) {
        requestCount += 1;
        store.dispatch(setLoading(true));
      }

      // add x-auth-token
      const accessToken = getAccessToken();
      if (accessToken) {
        // config.headers['x-auth-token'] = accessToken;
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      return config;
    },
    (error) => {
      if (error.config.showSpinner) {
        decreaseRequestCount();
      }
      return Promise.reject(error);
    },
  );

  axiosInstance.interceptors.response.use(
    (res) => {
      if (res.config.showSpinner) {
        decreaseRequestCount();
      }
      return res;
    },
    (error) => {
      if (
        (error && error.config.showSpinner) ||
        error.code === "ECONNABORTED"
      ) {
        decreaseRequestCount();
      }

      // handle request timeout
      if (error.code === "ECONNABORTED") {
        store.dispatch(setLoading(false));
      }

      // access token expired
      // if(error.response.status === 401 && error.config._retry) {
      //   error.config._retry = true;
      //   try {
      //     const result = await instance.post("/auth/refreshtoken", {
      //       refreshToken: 'xxx'
      //     });
      //     window.localStorage.setItem("accessToken", result.data.accessToken);
      //     axiosInstance.defaults.headers.common["x-access-token"] =  result.data.accessToken; (option 1)
      //     axiosInstance.defaults.headers.common.Authorization = `Bearer ${result.data.accessToken}`; (option 2)

      //     return instance(error.config);
      //   } catch (err) {
      //     if (err.response && err.response.data) {
      //       return Promise.reject(err.response.data);
      //     }
      //     return Promise.reject(err);
      //   }
      // }

      // handle errors
      switch (error.response?.status) {
        case 400: {
          break;
        }
        case 500: {
          break;
        }
        default:
          break;
      }
      return Promise.reject(error);
    },
  );
}
