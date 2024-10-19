/**
 * ## state
 * 
 * @module
 */

export interface StateNotifier {
   (newValue: number): void;
}

export interface State {
   value: number;
   subscribe(notifier: StateNotifier):void
}

export class DiscreteState implements State{
   private stateValue: number;
   private subscribers: StateNotifier[];
   constructor(initialValue = 0, stateValues = 2) {
      this.stateValue = initialValue;
      this.subscribers = [];
   }
   public subscribe(notifier: StateNotifier) {
      this.subscribers.push(notifier);
   }
   public get value() {
      return this.stateValue;
   }
   public set value(newValue: number) {
      this.stateValue = newValue;
      this.subscribers.forEach((n) => n(newValue));
   }
   public toString() {
      return this.stateValue;
   }
}
