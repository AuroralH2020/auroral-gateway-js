
export class EventHandler {
    readonly oid: string
    readonly eid: string
    private _subscribers: Set<string> = new Set<string>()
   
    // Creating event channel
    constructor(oid: string, eid: string, subscribers: Set<string> = new Set<string>()) {
      this.oid = oid
      this.eid = eid
      this._subscribers = subscribers
    }
    public addSubscriber(oid: string) {
      this._subscribers.add(oid)
    }
    public removeSubscriber(oid: string) {
      this._subscribers.delete(oid)
    } 
    public get subscribers(): Set<string> {
      return this._subscribers
    }  
}
