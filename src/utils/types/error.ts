export type ResponseError = {
  data: unknown | null;
  error: {
    status: number;
    name: string;
    message: string;
    details: object;
  };
};

export function isResponseError(error: any): error is ResponseError {
  return (
    error.error.status !== undefined &&
    error.error.name !== undefined &&
    error.error.message !== undefined
  );
}
