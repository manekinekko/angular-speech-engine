import {NgZone, EventEmitter} from '@angular/core';

export interface IWindow extends Window {
  webkitSpeechRecognition: any;
  mozSpeechRecognition: any;
  msSpeechRecognition: any;
  SpeechRecognition: any;
}

export interface IEvent {
  type:string;
  value: string;
}

export enum SpeechErrors {
  NoSpeech,
  NoMic,
  Denied,
  Blocked
}

let createEngine = (): any => {
  let win: IWindow = <IWindow>window;
  return new (
    win.webkitSpeechRecognition ||
    win.mozSpeechRecognition ||
    win.msSpeechRecognition ||
    win.SpeechRecognition
  )();
};

export abstract class AbstractSpeechEngine {

  private engine: any = null;
  private recognizing: boolean = false;
  private start_timestamp: number = 0;
  private transcript: string = '';
  private obs$: EventEmitter<IEvent>;
  private err$: EventEmitter<any>;

  constructor(private zone: NgZone) {
    this.obs$ = new EventEmitter<IEvent>();
    this.err$ = new EventEmitter<any>();

    this.create();
  }

  create() {
    this.engine = createEngine();
    this.engine.continuous = true;
    this.engine.lang = 'en-US';

    this.engine.onstart =       this.onstart.bind(this);
    this.engine.onerror =       this.onerror.bind(this);
    this.engine.onend =         this.onend.bind(this);
    this.engine.onresult =      this.onresult.bind(this);
    this.engine.onaudiostart =  this.onaudiostart.bind(this);
    this.engine.onsoundstart =  this.onsoundstart.bind(this);
    this.engine.onspeechstart = this.onspeechstart.bind(this);
    this.engine.onspeechend =   this.onspeechend.bind(this);
    this.engine.onsoundend =    this.onsoundend.bind(this);
    this.engine.onaudioend =    this.onaudioend.bind(this);
    this.engine.onnomatch =     this.onnomatch.bind(this);
  }

  toggle(event) {
    if (this.recognizing) {
      this.engine.stop();
      return false;
    }

    this.start_timestamp = event.timeStamp;
    this.engine.start();
    console.log('info_allow');
    return true;
  }
  stop() {
    this.engine.stop();
  }
  toRx() {
    return {
      values: this.obs$,
      errors: this.err$
    }
  }
  isRecognizing() {
    return this.recognizing;
  }

  private onaudiostart() {
    this.zone.run( () => {
      this.obs$.emit({
        type: 'hint',
        value: 'capturing audio...'
      });
    });
  }

  private onsoundstart() {
    this.zone.run( () => {
      this.obs$.emit({
        type: 'hint',
        value: 'detecting sound...'
      });
    });
  }

  private onspeechstart() {
    this.zone.run( () => {
      this.obs$.emit({
        type: 'hint',
        value: 'detecting speech...'
      });
    });
  }

  private onspeechend() {
    this.zone.run( () => {
      //this.obs$.emit({
      //  type: 'hint',
      //  value: 'speech detecetd'
      //});
    });
  }

  private onsoundend() {
    this.zone.run( () => {
      //this.obs$.emit({
      //  type: 'hint',
      //  value: 'sound detecetd'
      //});
    });
  }

  private onaudioend() {
    this.zone.run( () => {
      //this.obs$.emit({
      //  type: 'hint',
      //  value: 'audio detecetd'
      //});
    });
  }

  private onnomatch() {
    this.zone.run( () => {
      this.obs$.emit({
        type: 'hint',
        value: 'no match!'
      });
    });
  }

  private onstart() {
    this.zone.run( () => {
      console.log('reconizing');
      this.recognizing = true;
    });
  }

  private onerror(event) {
    //this.zone.run( () => {

      this.recognizing = false;

      if (event.error == 'no-speech') {
        console.error('no-speech');
        this.err$.emit(SpeechErrors.NoSpeech);
      }
      if (event.error == 'audio-capture') {
        console.error('audio-capture');
        this.err$.emit(SpeechErrors.NoMic);
      }
      if (event.error == 'not-allowed') {
        if (event.timeStamp - this.start_timestamp < 100) {
          console.error('not-allowed');
          this.err$.emit(SpeechErrors.Blocked);
        } else {
          console.error('denied');
          this.err$.emit(SpeechErrors.Denied);
        }
      }

    //});

  }

  private onend() {
    this.zone.run( () => {
      this.recognizing = false;
      //this.obs$.complete();
    });
  };

  private onresult(event) {
    this.zone.run( () => {
      this.transcriptText(event);
    });
  }

  private transcriptText(event) {
    if (typeof(event.results) == 'undefined') {
      this.engine.stop();
      return;
    }

    for (var i = event.resultIndex; i < event.results.length; ++i) {
      this.obs$.emit({
        type: 'tag',
        value: event.results[i][0].transcript
      });
    }
  }

}
