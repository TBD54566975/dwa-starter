import { LitElement, html } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { when } from 'lit/directives/when.js';

// You can also import styles from another file
// if you prefer to keep your CSS seperate from your component
import { styles } from './playground-styles';

import { styles as sharedStyles } from '../../styles/shared-styles'
import {
  didCreate,
  didRegister,
  dwnRequestPNGPermissions,
  dwnDeleteRecordWithId,
  dwnQueryPNGRecords,
  dwnReadDataFromRecordWithId,
  dwnWritePNGRecord,
  web5,
} from '../../web5';

import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';

const DIDStorageKey = 'app-playground-did';

@customElement('app-playground')
export class AppPlayground extends LitElement {
  _didTextareaRef = createRef();
  @property({ type: Object }) _did = null;
  @property({ type: Boolean }) _hasRegisteredDID = false;

  @property({ type: Boolean }) _isConnecting = false;
  @property({ type: String }) _connectPIN = '';
  @property({ type: Boolean }) _hasConnected = false;

  _fileInputRef = createRef();
  @property({ type: Boolean }) _isWriting = false;
  @property({ type: Array }) _writeResults = [ ];

  @property({ type: Boolean }) _isQuerying = false;
  @property({ type: Object }) _queryResult = null;

  @property({ type: Boolean }) _isReading = false;
  @property({ type: Array }) _readResults = [ ];

  @property({ type: Boolean }) _isDeleting = false;
  @property({ type: Array }) _deleteResults = [ ];


  static get styles() {
    return [
      sharedStyles,
      styles,
    ];
  }

  constructor() {
    super();

    let did;
    try {
      did = JSON.parse(localStorage.getItem(DIDStorageKey));
    } catch { }
    this._setDID(did);
  }

  render() {
    return html`
      <app-header ?enableBack="${true}"></app-header>

      <main>
        <h2>Playground Page</h2>

        <sl-tab-group>
          <sl-tab slot="nav" panel="create">Create</sl-tab>
          <sl-tab-panel name="create">
            <sl-card id="did-create">
              <h2>Create a <a href="https://developer.tbd.website/docs/web5/learn/decentralized-identifiers">Decentralized Identifier</a></h2>

              <sl-button variant="primary" @click=${this._handleDIDCreateButtonClick}>Run!</sl-button>

              <sl-details>
                ${when(this._did && !this._hasConnected, () => html`<code slot="summary">${this._did.internalId ?? `...`}</code>`, () => html`<span slot="summary">Hit "Run" above to create DID</span>`)}

                <sl-textarea value="${(this._did && !this._hasConnected) ? JSON.stringify(this._did, null, 2) : ''}" @sl-change=${this._handleDIDCreateTextareaChange} ${ref(this._didTextareaRef)}></sl-textarea>
              </sl-details>
            </sl-card>
            <sl-card id="did-register">
              <h2>Register the <a href="https://developer.tbd.website/docs/web5/learn/decentralized-identifiers">Decentralized Identifier</a></h2>

              <sl-button variant="primary" ?disabled=${!this._did || this._hasRegisteredDID || this._hasConnected} @click=${this._handleDIDRegisterButtonClick}>Run!</sl-button>
              ${when(this._hasRegisteredDID, () => html`&#x2714; Registered!`)}
            </sl-card>
          </sl-tab-panel>

          <sl-tab slot="nav" panel="connect">Connect</sl-tab>
          <sl-tab-panel name="connect">
            <sl-card id="did-connect">
              <h2>Connect to a <a href="https://developer.tbd.website/docs/glossary#key-store">Key Store</a></h2>

              <sl-button variant="primary" ?disabled=${this._isConnecting || this._hasConnected} @click=${this._handleDIDConnectButtonClick}>Run!</sl-button>
              ${when(this._isConnecting, () => html`<sl-progress-bar indeterminate></sl-progress-bar>`)}
              ${when(this._hasConnected, () => html`&#x2714; Connected!`)}

              ${when(this._isConnecting && !this._hasConnected && this._connectPIN, () => html`<sl-divider></sl-divider>`)}
              ${when(this._isConnecting && !this._hasConnected && this._connectPIN, () => html`PIN: ${map(this._connectPIN, (digit) => html`<sl-badge variant="primary">${digit}</sl-badge>`)}`)}
            </sl-card>
          </sl-tab-panel>
        </sl-tab-group>

        <sl-card id="dwn-write">
          <h2>Write some <a href="https://developer.tbd.website/docs/web5/learn/decentralized-web-nodes#data-model">data</a></h2>

          <input type="file" accept="image/png" ?disabled=${!this._hasRegisteredDID && !this._hasConnected} @change=${this._handleDWNWriteInputChange} ${ref(this._fileInputRef)}>

          <sl-button variant="primary" ?disabled=${this._isWriting || (!this._hasRegisteredDID && !this._hasConnected) || !this._fileInputRef.value?.files.length} @click=${this._handleDWNWriteButtonClick}>Run!</sl-button>
          ${when(this._isWriting, () => html`<sl-progress-bar indeterminate></sl-progress-bar>`)}

          <sl-details>
            <span slot="summary">${when(this._writeResults.length, () => html`&#x2714; Written!`, () => `...`)}</span>

            <sl-textarea value="${this._writeResults.length ? JSON.stringify(this._writeResults, null, 2) : ''}" readonly></sl-textarea>
          </sl-details>
        </sl-card>
        <sl-card id="dwn-query">
          <h2>Query for <a href="https://developer.tbd.website/docs/web5/learn/decentralized-web-nodes#messaging">messages</a></h2>

          <sl-button variant="primary" ?disabled=${this._isQuerying || (!this._hasRegisteredDID && !this._hasConnected)} @click=${this._handleDWNQueryButtonClick}>Run!</sl-button>
          ${when(this._isQuerying, () => html`<sl-progress-bar indeterminate></sl-progress-bar>`)}

          <sl-details>
            <span slot="summary">${when(this._queryResult, () => html`&#x2714; Found ${this._queryResult.entries?.length ?? 0} entries!`, () => `...`)}</span>

            <sl-textarea value="${this._queryResult ? JSON.stringify(this._queryResult, null, 2) : ''}" readonly></sl-textarea>
          </sl-details>
        </sl-card>
        <sl-card id="dwn-read">
          <h2>Read the <a href="https://developer.tbd.website/docs/web5/learn/decentralized-web-nodes#data-model">data</a></h2>

          <sl-button variant="primary" ?disabled=${this._isReading || !this._queryResult?.entries?.length || this._deleteResults.length} @click=${this._handleDWNReadButtonClick}>Run!</sl-button>
          ${when(this._isReading, () => html`<sl-progress-bar indeterminate></sl-progress-bar>`)}

          ${when(this._readResults.length, () => html`<sl-divider></sl-divider>`)}
          ${map(this._readResults, (data) => html`<img src="${data}">`)}
        </sl-card>
        <sl-card id="dwn-delete">
          <h2>Delete the <a href="https://developer.tbd.website/docs/web5/learn/decentralized-web-nodes#messaging">messages</a></h2>

          <sl-button variant="primary" ?disabled=${this._isDeleting || !this._queryResult?.entries?.length || this._deleteResults.length} @click=${this._handleDWNDeleteButtonClick}>Run!</sl-button>
          ${when(this._isDeleting, () => html`<sl-progress-bar indeterminate></sl-progress-bar>`)}

          <sl-details>
            <span slot="summary">${when(this._deleteResults.length, () => html`&#x2714; Deleted ${this._deleteResults.length} entries!`, () => `...`)}</span>

            <sl-textarea value="${this._deleteResults.length ? JSON.stringify(this._deleteResults, null, 2) : ''}" readonly></sl-textarea>
          </sl-details>
        </sl-card>
      </main>
    `;
  }

  _setDID(did, options = { }) {
    if (did?.id && did?.internalId && did?.keys?.[0]?.keyPair) {
      this._did = did;
    } else {
      this._did = null;
    }

    if (options.cache) {
      if (this._did) {
        localStorage.setItem(DIDStorageKey, JSON.stringify(this._did));
      } else {
        localStorage.removeItem(DIDStorageKey);
      }
    }
  }

  async _handleDIDCreateButtonClick() {
    this._setDID(await didCreate(), { cache: true });

    this._hasRegisteredDID = false;
    this._hasConnected = false;
    this._writeResults = [ ];
    this._queryResult = null;
    this._readResults = [ ];
    this._deleteResults = [ ];
  }

  async _handleDIDCreateTextareaChange() {
    let did;
    try {
      did = JSON.parse(this._didTextareaRef.value.value);
    } catch { }
    this._setDID(did, { cache: true });

    this._hasRegisteredDID = false;
    this._hasConnected = false;
    this._writeResults = [ ];
    this._queryResult = null;
    this._readResults = [ ];
    this._deleteResults = [ ];
  }

  async _handleDIDRegisterButtonClick() {
    await didRegister(this._did);
    this._hasRegisteredDID = true;
    this._hasConnected = false;
  }

  async _handleDIDConnectButtonClick() {
    this._isConnecting = true;

    const handleChallenge = (event) => {
      this._connectPIN = event.detail.pin;
    };

    const handleAuthorized = (event) => {
      this._did = {
        id: event.detail.did,
      };
      this._hasConnected = true;

      finish();
    };

    const handleDenied = () => {
      finish();

      window.alert('Connect denied!');
    };

    const handleBlocked = () => {
      finish();

      window.alert('Connect blocked!');
    };

    const handleError = () => {
      finish();

      window.alert('Connect failed!');
    };

    const finish = () => {
      this._isConnecting = false;
      this._connectPIN = '';

      web5.removeEventListener('challenge', handleChallenge);
      web5.removeEventListener('authorized', handleAuthorized);
      web5.removeEventListener('denied', handleDenied);
      web5.removeEventListener('blocked', handleBlocked);
      web5.removeEventListener('error', handleError);
    };

    web5.addEventListener('challenge', handleChallenge);
    web5.addEventListener('authorized', handleAuthorized);
    web5.addEventListener('denied', handleDenied);
    web5.addEventListener('blocked', handleBlocked);
    web5.addEventListener('error', handleError);

    await web5.did.connect();

    await dwnRequestPNGPermissions(this._did ?? { });
  }

  async _handleDWNWriteInputChange() {
    this._writeResults = [ ];
  }

  async _handleDWNWriteButtonClick() {
    this._isWriting = true;

    this._writeResults = [ ];
    for (const file of this._fileInputRef.value.files) {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      const writeResult = await dwnWritePNGRecord(this._did, data);
      this._writeResults.push(writeResult);
    }

    this._isWriting = false;

    this._queryResult = null;
    this._readResults = [ ];
    this._deleteResults = [ ];
  }

  async _handleDWNQueryButtonClick() {
    this._isQuerying = true;

    this._queryResult = null;
    this._queryResult = await dwnQueryPNGRecords(this._did);

    this._isQuerying = false;

    this._readResults = [ ];
    this._deleteResults = [ ];
  }

  async _handleDWNReadButtonClick() {
    this._isReading = true;

    this._readResults = [ ];
    for (const record of this._queryResult.entries) {
      const readResult = await dwnReadDataFromRecordWithId(this._did, record.id);
      const dataStream = await readResult.record.data;
      const dataBytes = await web5.dwn.sdk.DataStream.toBytes(dataStream);
      this._readResults.push(URL.createObjectURL(new Blob([ dataBytes ])));
    }

    this._isReading = false;
  }

  async _handleDWNDeleteButtonClick() {
    this._isDeleting = true;

    this._deleteResults = [ ];
    for (const record of this._queryResult.entries) {
      const deleteResult = await dwnDeleteRecordWithId(this._did, record.id);
      this._deleteResults.push(deleteResult);
    }

    this._isDeleting = false;

    this._queryResult = null;
  }
}
