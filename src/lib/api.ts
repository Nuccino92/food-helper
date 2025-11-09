type RequestInterceptor = (
  config: RequestInit,
) => RequestInit | Promise<RequestInit>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

export class ApiClient {
  private baseURL: string;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseURL: string = "") {
    this.baseURL = baseURL;
  }

  // Method to add a request interceptor
  public addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  // Method to add a response interceptor
  public addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  private async _request(
    endpoint: string,
    options: RequestInit,
  ): Promise<Response> {
    let config = { ...options };

    // Apply all request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }

    let response = await fetch(`${this.baseURL}${endpoint}`, config);

    // Apply all response interceptors
    for (const interceptor of this.responseInterceptors) {
      response = await interceptor(response);
    }

    return response;
  }

  // Method for standard JSON requests
  public async post<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await this._request(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return response.json();
  }

  // Special method for streaming requests
  public postStream(
    endpoint: string,
    body: unknown,
    signal?: AbortSignal,
  ): Promise<Response> {
    return this._request(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  }

  // You can add get, put, delete methods here as well
  public async get<T>(endpoint: string): Promise<T> {
    const response = await this._request(endpoint, { method: "GET" });
    return response.json();
  }
}
