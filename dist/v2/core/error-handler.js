export function handleError(error) {
  console.error(error);

  return {
    message: error?.message || "Terjadi kesalahan sistem."
  };
}
