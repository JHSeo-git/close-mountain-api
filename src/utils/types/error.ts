export type ResponseError = {
  status: number;
  name: string;
  message: string;
  details: object;
};

export function isResponseError(error: any): error is ResponseError {
  return (
    error.status !== undefined &&
    error.name !== undefined &&
    error.message !== undefined
  );
}
