
export class EventHandler {
    readonly oid: string
    readonly eid: string
    private subscribers: Set<string> = new Set<string>()
   
    // Creating event channel
    constructor(oid: string, eid: string, subscribers: Set<string> = new Set<string>()) {
      this.oid = oid
      this.eid = eid
      this.subscribers = subscribers
    }
    public addSubscriber(oid: string) {
      this.subscribers.add(oid)
    }
    public removeSubscriber(oid: string) {
      this.subscribers.delete(oid)
    } 
    public getSubscribers(): Set<string> {
      return this.subscribers
    }
    
}
