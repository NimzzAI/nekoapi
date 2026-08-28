interface EndpointItem {
  id: string;
  method: string;
  path: string;
  category: string;
  description: string;
  rateLimit: string;
  responseKind: string;
  calls: number;
}

interface EndpointsResponse {
  success: boolean;
  data: { count: number; endpoints: EndpointItem[] };
}

async function main(): Promise<void> {
  const state = document.getElementById("state")!;
  const list = document.getElementById("list")!;

  let body: EndpointsResponse;
  try {
    const res = await fetch("/endpoints");
    body = (await res.json()) as EndpointsResponse;
  } catch {
    state.textContent = "Could not load endpoints.";
    return;
  }

  const byCategory = new Map<string, EndpointItem[]>();
  for (const e of body.data.endpoints) {
    const bucket = byCategory.get(e.category) ?? [];
    bucket.push(e);
    byCategory.set(e.category, bucket);
  }

  for (const [category, items] of byCategory) {
    const section = document.createElement("div");
    section.className = "category";

    const h2 = document.createElement("h2");
    h2.textContent = category;
    section.appendChild(h2);

    for (const e of items) {
      const row = document.createElement("div");
      row.className = "endpoint";
      row.innerHTML =
        `<div><div class="path">${e.path}</div><div class="desc">${e.description}</div></div>` +
        `<span class="method">${e.method}</span>`;
      section.appendChild(row);
    }

    list.appendChild(section);
  }

  state.remove();
}

main();
