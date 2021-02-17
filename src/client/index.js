import { Manager } from './sandpack';
import { name } from '../../package.json';
import { WS_EVENTS } from '../constants';

let sandpackManager = new Manager('#root', { showOpenInCodeSandbox: false });
const info = (message) => console.log(`${name}: ${message}`)
const ws = new WebSocket(`ws://${window.location.host}`);
let sandboxFiles;
let historyStateUID = 0;

function getRelativeUrl(url) {
  return url.replace(sandpackManager.bundlerURL, "");
}

window.onpopstate = () => {
  // back btn
  if (historyStateUID > history.state.uid) {
    sandpackManager.dispatch({ type: 'urlback' });
  } else {
    sandpackManager.dispatch({ type: 'urlforward' });
  }
}

sandpackManager.listen((evt) => {
  switch (evt.type) {
    case "urlchange": {
      const relativeUrl = getRelativeUrl(evt.url);

      history.pushState({ uid: historyStateUID }, '', relativeUrl);
      historyStateUID++;
    }
  }
});


ws.onopen = () => info('connected');

ws.onmessage = (evt) => {
  const { type, data } = JSON.parse(evt.data);
  
  switch (type) {
    case WS_EVENTS.INIT: {
      sandboxFiles = data;

      sandpackManager.updatePreview({
        files: data,
        showOpenInCodeSandbox: false
      });

      break;
    }
    case WS_EVENTS.PATCH: {
      const { event, fileContent, path } = data;

      // do a full page reload on new file or folder creation or deletion
      if (event === 'add' || event === 'unlink') {
        window.location.reload();
      }

      const updatedFiles = { ...sandboxFiles, [path]: { code: fileContent } };

      sandpackManager.updatePreview({ files: updatedFiles, showOpenInCodeSandbox: false });
      break;
    }
  }
}
