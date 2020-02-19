import axios from "axios";

export default class api {
  constructor() {
    this.url = "https://s187cga0ve.execute-api.us-east-1.amazonaws.com/api/";
  }

  // POST Request
  async post(endpoint, body) {
    try {
      const response = await axios.post(
        this.url + endpoint,
        JSON.stringify(body)
      );
      return response;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  // GET request
  async get(queryParameter) {
    try {
      // With query parameter
      const response = await axios.get(this.url + "?" + queryParameter);

      // to a specific endpoint, without query parameter, given that
      // the parameter, 'parameter' contains the specific ending in relation
      // to the base url:
      //   const response = await axios.get(this.url + parameter);

      return response;
    } catch (error) {
      console.error(error);
      return error;
    }
  }
}
