interface UrlFormProps {
  urlInput: string;
  onUrlInputChange: (value: string) => void;
  onLoad: () => void;
  loading: boolean;
  error: string | null;
}

export function UrlForm({
  urlInput,
  onUrlInputChange,
  onLoad,
  loading,
  error,
}: UrlFormProps) {
  return (
    <section className="url-form">
      <label htmlFor="youtube-url">YouTube URL</label>
      <div className="url-row">
        <input
          id="youtube-url"
          type="text"
          placeholder="https://www.youtube.com/watch?v=..."
          value={urlInput}
          onChange={(e) => onUrlInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onLoad()}
        />
        <button type="button" onClick={onLoad} disabled={loading}>
          {loading ? "読み込み中…" : "読み込む"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
