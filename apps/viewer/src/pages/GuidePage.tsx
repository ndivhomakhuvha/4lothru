import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { parseGuideJson, type Guide, type GuideValidationIssue } from "@trail/guide-schema";

type LoadState = "loading" | "found" | "not-found" | "invalid";

export default function GuidePage() {
  const { release, guideId } = useParams<{ release: string; guideId: string }>();
  const [state, setState] = useState<LoadState>("loading");
  const [guide, setGuide] = useState<Guide | null>(null);
  const [issues, setIssues] = useState<GuideValidationIssue[]>([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState("loading");

    async function load() {
      let response: Response;
      try {
        response = await fetch(`/guides/releases/${release}/${guideId}.json`);
      } catch {
        if (!cancelled) setState("not-found");
        return;
      }
      if (cancelled) return;

      if (!response.ok) {
        setState("not-found");
        return;
      }

      const text = await response.text();
      const result = parseGuideJson(text);
      if (cancelled) return;

      if (!result.success) {
        setIssues(result.issues);
        setState("invalid");
        return;
      }

      setGuide(result.guide);
      setState("found");
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [release, guideId]);

  function handleStart() {
    if (!guide || !release) return;
    setStarting(true);
    const url = new URL(guide.start.url);
    url.searchParams.set("trail", guide.id);
    url.searchParams.set("release", release);
    window.location.href = url.toString();
  }

  if (state === "loading") {
    return <p className="hint">Loading guide&hellip;</p>;
  }

  if (state === "not-found") {
    return (
      <div className="guide-card error-card">
        <h1>Trail Guide Not Found</h1>
        <p>{guideId}</p>
        <p>Release {release}</p>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="guide-card error-card">
        <h1>Invalid Trail Guide</h1>
        <p>{guideId} failed validation.</p>
        <ul className="issue-list">
          {issues.map((issue, i) => (
            <li key={i}>
              <code>{issue.path}</code>: {issue.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const g = guide!;
  return (
    <div className="guide-card">
      <h1>{g.title}</h1>
      <dl className="meta-list">
        <dt>Release</dt>
        <dd>{release}</dd>
        <dt>Application</dt>
        <dd>{g.application}</dd>
      </dl>
      <p className="step-count">{g.steps.length} test steps</p>
      <button type="button" className="btn btn-primary" onClick={handleStart} disabled={starting}>
        {starting ? "Opening application…" : "Start Test"}
      </button>
    </div>
  );
}
