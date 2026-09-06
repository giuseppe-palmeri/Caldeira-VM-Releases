#!/bin/bash
# fetch-github-data.sh
# Regenerates the static GitHub-derived data for the Caldeira VM website.
#
# Publishes data/{releases,issues,activity,repo}.json from the PUBLIC GitHub API.
# No authentication required (public repo, unauthenticated rate limits apply).
# Requires: curl, python3 (no jq dependency).
#
# Usage:
#   bash scripts/fetch-github-data.sh [--output-dir DIR] [--events N]
#
#   --output-dir DIR  Write JSON files to DIR (default: data/)
#   --events N        Number of recent events to fetch (default: 30)

set -euo pipefail

REPO="giuseppe-palmeri/Caldeira-VM-Releases"
API="https://api.github.com/repos/$REPO"
OUT_DIR="data"
EVENTS_N=30

while [[ $# -gt 0 ]]; do
    case "$1" in
        --output-dir)
            OUT_DIR="$2"
            shift 2
            ;;
        --events)
            EVENTS_N="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
done

mkdir -p "$OUT_DIR"

# Helper: fetch a URL and write to a file; on failure writes an explicit empty result.
fetch_json() {
    local url="$1"
    local out="$2"
    local err="$3"
    if ! curl -fsSL --max-time 20 -H "Accept: application/vnd.github+json" "$url" > "$out" 2>/dev/null; then
        echo "{\"error\": \"$err\", \"url\": \"$url\", \"fetched_at\": null}" > "$out"
    fi
}

echo "== Caldeira VM website — GitHub data fetch =="
echo "Repo: $REPO"

# ── Repo metadata ──
fetch_json "$API" "$OUT_DIR/repo.raw.json" "repo unavailable"
# ── Releases (published only — GitHub API returns only published releases) ──
fetch_json "$API/releases" "$OUT_DIR/releases.raw.json" "releases unavailable"
# ── Issues ──
fetch_json "$API/issues?state=all&per_page=50" "$OUT_DIR/issues.raw.json" "issues unavailable"
# ── Recent public events (activity) ──
fetch_json "$API/events?per_page=$EVENTS_N" "$OUT_DIR/activity.raw.json" "activity unavailable"

python3 - "$OUT_DIR" <<'PY'
import json, os, sys, datetime

out = sys.argv[1]

def load(name):
    p = os.path.join(out, name)
    try:
        with open(p) as f:
            return json.load(f)
    except Exception:
        return {"error": "unreadable"}

def ts(iso):
    if not iso:
        return None
    try:
        return datetime.datetime.fromisoformat(iso.replace("Z", "+00:00")).isoformat()
    except Exception:
        return iso

def load_releases(raw):
    if isinstance(raw, dict) and raw.get("error"):
        return {"unavailable": True, "message": raw["error"], "releases": []}
    if not isinstance(raw, list):
        return {"unavailable": True, "message": "unexpected payload", "releases": []}
    rels = []
    for r in raw:
        rels.append({
            "name": r.get("name") or r.get("tag_name"),
            "tag": r.get("tag_name"),
            "published_at": ts(r.get("published_at")),
            "prerelease": bool(r.get("prerelease")),
            "draft": bool(r.get("draft")),
            "html_url": r.get("html_url"),
            "body": r.get("body") or "",
            "assets": [
                {"name": a.get("name"), "size": a.get("size"), "download_url": a.get("browser_download_url")}
                for a in (r.get("assets") or [])
            ],
        })
    rels.sort(key=lambda x: x["published_at"] or "", reverse=True)
    return {"unavailable": False, "releases": rels}

def load_issues(raw):
    if isinstance(raw, dict) and raw.get("error"):
        return {"unavailable": True, "message": raw["error"], "issues": []}
    if not isinstance(raw, list):
        return {"unavailable": True, "message": "unexpected payload", "issues": []}
    issues = []
    for i in raw:
        if "pull_request" in i:  # GitHub /issues includes PRs; skip them
            continue
        issues.append({
            "number": i.get("number"),
            "title": i.get("title"),
            "state": i.get("state"),
            "created_at": ts(i.get("created_at")),
            "updated_at": ts(i.get("updated_at")),
            "html_url": i.get("html_url"),
            "labels": [{"name": l.get("name"), "color": l.get("color")} for l in (i.get("labels") or [])],
        })
    issues.sort(key=lambda x: x.get("updated_at") or "", reverse=True)
    return {"unavailable": False, "issues": issues}

def load_activity(raw):
    if isinstance(raw, dict) and raw.get("error"):
        return {"unavailable": True, "message": raw["error"], "events": []}
    if not isinstance(raw, list):
        return {"unavailable": True, "message": "unexpected payload", "events": []}
    events = []
    for e in raw:
        events.append({
            "type": e.get("type"),
            "created_at": ts(e.get("created_at")),
            "actor": (e.get("actor") or {}).get("login") if isinstance(e.get("actor"), dict) else None,
            "ref": (e.get("payload") or {}).get("ref"),
            "ref_type": (e.get("payload") or {}).get("ref_type"),
            "head": (e.get("payload") or {}).get("head"),
        })
    return {"unavailable": False, "events": events}

def load_repo(raw):
    if not isinstance(raw, dict) or raw.get("error"):
        return {"unavailable": True}
    return {
        "name": raw.get("full_name"),
        "description": raw.get("description"),
        "html_url": raw.get("html_url"),
        "created_at": ts(raw.get("created_at")),
        "updated_at": ts(raw.get("updated_at")),
        "pushed_at": ts(raw.get("pushed_at")),
        "stargazers_count": raw.get("stargazers_count"),
        "forks_count": raw.get("forks_count"),
        "open_issues_count": raw.get("open_issues_count"),
        "language": raw.get("language"),
        "has_pages": raw.get("has_pages"),
        "default_branch": raw.get("default_branch"),
        "license": (raw.get("license") or {}).get("spdx_id"),
    }

now = datetime.datetime.now(datetime.timezone.utc).isoformat()

def dump(name, data):
    p = os.path.join(out, name)
    with open(p, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"  wrote {p}")

dump("releases.json", {"generated_at": now, "source": f"https://api.github.com/repos/{os.environ.get('REPO','giuseppe-palmeri/Caldeira-VM-Releases')}/releases", **load_releases(load("releases.raw.json"))})
dump("issues.json", {"generated_at": now, "source": f"https://api.github.com/repos/{os.environ.get('REPO','giuseppe-palmeri/Caldeira-VM-Releases')}/issues", **load_issues(load("issues.raw.json"))})
dump("activity.json", {"generated_at": now, "source": f"https://api.github.com/repos/{os.environ.get('REPO','giuseppe-palmeri/Caldeira-VM-Releases')}/events", **load_activity(load("activity.raw.json"))})
dump("repo.json", {"generated_at": now, **load_repo(load("repo.raw.json"))})
PY

# ── Cleanup raw files ──
rm -f "$OUT_DIR"/*.raw.json

echo "Done. Files written to $OUT_DIR/"