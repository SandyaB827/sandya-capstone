import * as signalR from '@microsoft/signalr';

class SignalRConnection {
    constructor() {
        this.connection = null;
        this.listeners = new Map();
        this.pendingListeners = new Map();
        this.connectionPromise = null;
    }

    async start(token) {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = new Promise(async (resolve, reject) => {
            try {
                if (this.connection) {
                    resolve(this.connection);
                    return;
                }

                this.connection = new signalR.HubConnectionBuilder()
                    .withUrl('http://localhost:5231/smarthomehub', {
                        accessTokenFactory: () => token
                    })
                    .withAutomaticReconnect()
                    .build();

                this.connection.onclose(() => {
                    console.log('SignalR connection closed');
                    this.connection = null;
                    this.connectionPromise = null;
                });

                await this.connection.start();
                console.log('SignalR connection established');

                // Set up any pending listeners
                for (const [eventName, callbacks] of this.pendingListeners.entries()) {
                    callbacks.forEach(callback => {
                        this.addListener(eventName, callback);
                    });
                }
                this.pendingListeners.clear();

                resolve(this.connection);
            } catch (err) {
                console.error('Error establishing SignalR connection:', err);
                this.connection = null;
                this.connectionPromise = null;
                reject(err);
            }
        });

        return this.connectionPromise;
    }

    addListener(eventName, callback) {
        if (!this.connection) {
            // Store as pending listener if connection isn't ready
            if (!this.pendingListeners.has(eventName)) {
                this.pendingListeners.set(eventName, new Set());
            }
            this.pendingListeners.get(eventName).add(callback);
            return;
        }

        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
            this.connection.on(eventName, (...args) => {
                this.listeners.get(eventName).forEach(cb => cb(...args));
            });
        }

        this.listeners.get(eventName).add(callback);
    }

    removeListener(eventName, callback) {
        // Remove from pending listeners if present
        if (this.pendingListeners.has(eventName)) {
            this.pendingListeners.get(eventName).delete(callback);
            if (this.pendingListeners.get(eventName).size === 0) {
                this.pendingListeners.delete(eventName);
            }
        }

        // Remove from active listeners if connection exists
        if (this.connection && this.listeners.has(eventName)) {
            const eventListeners = this.listeners.get(eventName);
            eventListeners.delete(callback);

            if (eventListeners.size === 0) {
                this.connection.off(eventName);
                this.listeners.delete(eventName);
            }
        }
    }

    async stop() {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            this.connectionPromise = null;
            this.listeners.clear();
            this.pendingListeners.clear();
        }
    }
}

export const signalRConnection = new SignalRConnection(); 