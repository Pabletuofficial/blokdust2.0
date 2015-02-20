import Effect = require("../Effect");
import ISource = require("../ISource");
import Grid = require("../../Grid");
import App = require("../../App");
import PooledOscillator = require("../../PooledOscillator");
import KeyDownEventArgs = require("../../Core/Inputs/KeyDownEventArgs");
import PitchComponent = require("./../Effects/Pitch");

/**
 * Base class for mono, poly and midi keyboards
 */
class Keyboard extends Effect {

    public BaseFrequency: number;
    public CurrentOctave: number;
    public KeysDown: any;

    constructor(grid: Grid, position: Point){

        this.KeysDown = {};

        super(grid, position);


        App.KeyboardInput.KeyDownChange.on((e: Fayde.IEventBindingArgs<KeyDownEventArgs>) => {

            //if KeyDown is a keyboard note or an octave shifter
            if ((<any>e).KeyDown.substring(0, 5) === 'note_' || (<any>e).KeyDown === 'octave-up' ||  (<any>e).KeyDown === 'octave-down'){
                this.KeysDown = (<any>e).KeysDown;

                console.log('need to use off function in this.Delete but how does it work?');
                // FOR ALL SOURCES
                for (var i = 0; i < this.Sources.Count; i++) {
                    var source = this.Sources.GetValueAt(i);
                    this.KeyboardDown((<any>e).KeyDown, source);
                }
            }
        }, this);

        App.KeyboardInput.KeyUpChange.on((e: Fayde.IEventBindingArgs<KeyDownEventArgs>) => {

            // FOR ALL SOURCES
            for (var i = 0; i < this.Sources.Count; i++) {
                var source = this.Sources.GetValueAt(i);

                // If its an octave shift no need to call KeyboardUp
                if ((<any>e).KeyUp !== 'octave-up' && (<any>e).KeyUp !== 'octave-down') {
                    this.KeyboardUp((<any>e).KeyUp, source);
                }
            }

            this.KeysDown = (<any>e).KeysDown;

        }, this);


        // Define Outline for HitTest
        this.Outline.push(new Point(-1, 0),new Point(0, -1),new Point(2, 1),new Point(1, 2),new Point(-1, 2));
    }

    Draw() {
        super.Draw();
    }

    Attach(source:ISource): void{
        super.Attach(source);

        this.SetBaseFrequency(source);
        this.KeysDown = {};
    }

    Detach(source:ISource): void {

        // FOR ALL SOURCES
        for (var i = 0; i < this.Sources.Count; i++) {
            var source = this.Sources.GetValueAt(i);

            if (this.IsPressed){
                source.Envelope.triggerRelease();
            }

            if (source.Source.frequency){
                source.Source.frequency.setValue(source.Frequency);
            }
        }

        super.Detach(source);

    }

    Delete(){
        // TODO: CALL DISCONNECT if not already disconnected
        //TODO: make this event watcher stop
        //App.KeyboardInput.KeyDownChange.off((e: Fayde.IEventBindingArgs<KeyDownEventArgs>) => {}, this);
        //App.KeyboardInput.KeyUpChange.off((e: Fayde.IEventBindingArgs<KeyDownEventArgs>) => {}, this);
        this.KeysDown = {};
        this.BaseFrequency = null;
        this.CurrentOctave = null;
    }

    SetValue(param: string,value: number) {
        super.SetValue(param,value);
    }

    GetValue(param: string) {
        super.GetValue(param);
    }

    OpenParams() {
        super.OpenParams();
    }

    KeyboardDown(key:string, source:ISource): void {
        if (key == 'octave-up' && this.CurrentOctave < 9) {
            this.CurrentOctave++;
            //return;
        }

        if (key === 'octave-down' && this.CurrentOctave != 0) {
            this.CurrentOctave--;
            //return;
        }
    }

    KeyboardUp(key:string, source:ISource): void {

    }

    public SetBaseFrequency(source:ISource){

        if (source.Frequency){
            this.BaseFrequency = source.Frequency;
            this.CurrentOctave = this.GetStartOctave(source);
            this.CurrentOctave--;
        }
    }

    public GetStartOctave(source): number {
        var octave,
            note = source.Source.frequencyToNote(this.BaseFrequency);

        if (note.length === 3) {
            octave = parseInt(note.charAt(2));
        } else {
            octave = parseInt(note.charAt(1));
        }

        return octave;
    }

    public GetKeyNoteOctaveString(keyCode): string {
        // Replaces keycode with keynote & octave string
        return (keyCode
            .replace('note_', '')
            .replace('_a', this.CurrentOctave)
            .replace('_b', this.CurrentOctave + 1)
            .replace('_c', this.CurrentOctave + 2)
            .replace('_d', this.CurrentOctave + 3)
            .toString());
    }

    public GetFrequencyOfNote(note, source): number {
        return source.Source.noteToFrequency(note) * this.GetConnectedPitchPreEffects(source);
    }

    public GetConnectedPitchPreEffects(source) {

        var totalPitchIncrement = 1;

        for (var i = 0; i < source.Effects.Count; i++) {
            var mod = source.Effects.GetValueAt(i);

            //TODO: Use reflection when available
            if ((<PitchComponent>mod).PitchIncrement) {
                var thisPitchIncrement = (<PitchComponent>mod).PitchIncrement;
                totalPitchIncrement *= thisPitchIncrement;
            }

        }

        return totalPitchIncrement;
    }

}

export = Keyboard;