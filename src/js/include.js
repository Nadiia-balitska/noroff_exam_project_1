(async () => {
        const nodes = document.querySelectorAll("[data-include]");
        for (const node of nodes) {
          const url = node.getAttribute("data-include");
          try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(res.status + " " + res.statusText);
            node.innerHTML = await res.text();
          } catch (e) {
            node.innerHTML = `<pre style="color:red">Include failed: ${url}\n${e}</pre>`;
          }
        }
      })();