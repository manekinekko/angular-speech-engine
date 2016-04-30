import {NgZone, Injectable, EventEmitter} from '@angular/core';
import {IWindow, IEvent, SpeechErrors, AbstractSpeechEngine} from './abstract-speech-engine';

@Injectable()
export class HTML5SpeechEngine extends AbstractSpeechEngine {

  constructor(zone: NgZone) {
    super(zone);
  }

}
