export function Loader() {
  return (
    <div className="loader-wrap" role="status" aria-label="Loading">
      <div className="rail-loader">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading">
      <div className="rail-loader">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}
