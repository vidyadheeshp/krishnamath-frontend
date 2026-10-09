import { toast } from 'sonner';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

const PAGE_STYLE = 'html,body{margin:0;height:100%;background:#475569;font-family:system-ui,sans-serif}iframe{border:0;width:100%;height:100%}.msg{color:#e2e8f0;display:flex;height:100%;align-items:center;justify-content:center;font-size:15px}';

const writePage = (win, title, body, script = '') => {
  win.document.open();
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${PAGE_STYLE}</style></head><body>${body}<script>${script}</script></body></html>`);
  win.document.close();
};

/**
 * Opens a jsPDF document in a new browser window (nothing is downloaded). The viewer there offers print and
 * save if wanted; with `print: true` the print dialog is raised automatically.
 *
 * `buildDoc` may be async (e.g. to load an image first). The window is opened immediately, straight from the
 * click, so the browser does not treat it as a blocked pop-up; it shows "Preparing…" until the PDF is ready.
 */
export function openPdfWindow(buildDoc, title, { print = false } = {}) {
  const pdfWindow = window.open('', '_blank');

  if (!pdfWindow) {
    toast.error('Your browser blocked the PDF window. Allow pop-ups for this site and try again.');
    return false;
  }

  writePage(pdfWindow, title, '<div class="msg">Preparing PDF…</div>');

  Promise.resolve()
    .then(buildDoc)
    .then((doc) => {
      const url = URL.createObjectURL(doc.output('blob'));
      writePage(
        pdfWindow,
        title,
        `<iframe id="pdf" src="${url}" title="${escapeHtml(title)}"></iframe>`,
        print
          ? "document.getElementById('pdf').addEventListener('load',function(){setTimeout(function(){try{this.contentWindow.focus();this.contentWindow.print();}catch(e){window.print();}}.bind(this),400);});"
          : '',
      );
      // The window keeps its own reference to the PDF; release ours after a while.
      setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
    })
    .catch((error) => {
      pdfWindow.close();
      toast.error('Could not generate the PDF.');
      console.error(error);
    });

  return true;
}
