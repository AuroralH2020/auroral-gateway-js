/**
 * redis.js
 * Interface to REDIS DB
 * @interface
 */
import redis, { ClientOpts } from 'redis'
import { Config } from '../config'
import { logger } from '../utils/logger'
import { JsonType } from '../types/misc-types'

const redisOptions = {
    port: Number(Config.DB.PORT), 
    host: Config.DB.HOST,
    auth_pass: Config.DB.PASSWORD
 } as ClientOpts

const client = redis.createClient(redisOptions)

// Exposes functions for working with the cache db REDIS
export const redisDb = {
   /**
   // INIT
   /**
    * Starts REDIS and listens to connect or error events;
    * @returns {void}
    */
   start: () => {
     client.on('error', (err) => {
         logger.error(err.message)
         process.exit(1)
     })
     client.on('connect', () => {
         logger.info('Connected successfully to Redis!!')
     })
   },
   /**
    * Checks REDIS connection status;
    * Rejects if REDIS not ready;
    * @async
    * @returns {boolean}
    */
   health: (): Promise<boolean> => {
     return new Promise((resolve, reject) => {
       client.ping((err, _reply) => {
         if (err) {
           logger.error(err.message)
           reject(err)
         } else {
          //  logger.debug('Redis is ready: ' + reply)
           resolve(true)
         }
       })
     })
   },
   // PERSIST
   /**
    * Force saving changes to dump.rdb;
    * Use to ensure critical changes will not be lost;
    * Does not reject on error, resolves false;
    * @async
    * @returns {string}
    */
   save: (): Promise<string | boolean> => {
     return new Promise((resolve, _reject) => {
       client.save((err, reply) => {
         if (err) {
           logger.warn(err)
           resolve(false)
         } else {
           logger.info(`REDIS DB persisted: ${reply}`)
           resolve(reply)
         }
       })
     })
   },
   // BASIC STRING STORAGE & REMOVAL
   /**
    * Save a string;
    * Custom defined ttl => 0 = no TTL;
    * rejects on error;
    * @async
    * @param {string} key
    * @param {*} item
    * @param {integer} ttl
    * @returns {boolean}
    */
   set: (key: string, item: string, ttl: number): Promise<boolean> => {
     return new Promise((resolve, reject) => {
       client.set(key, item, 'EX', ttl, (err, reply) => {
         if (err) {
           logger.error(err.message)
           reject(err)
         } else {
           resolve(true)
         }
       })
     })
   },
   /**
    * Remove manually one key or list stored;
    * rejects on error a boolean;
    * @async
    * @param {string} key
    * @returns {boolean}
    */
   remove: (key: string): Promise<boolean> => {
     return new Promise((resolve, reject) => {
       client.del(key, (err, _reply) => {
         if (err) {
           logger.error(err.message)
           reject(err)
         } else {
           resolve(true)
         }
       })
     })
   },
   /**
    * Get manually one key or list stored;
    * rejects on error a boolean;
    * @async
    * @param {string} key
    * @returns {string}
    */
   get: (key: string): Promise<string | null> => {
     return new Promise((resolve, reject) => {
       client.get(key, (err, reply) => {
         if (err) {
           logger.error(err.message)
           reject(err)
         } else {
           resolve(reply)
         }
       })
     })
   },
   // SETS
   /**
    * Adds item to set;
    * item can be an array of items or a string;
    * rejects on error a boolean;
    * @async
    * @param {string} key
    * @param {string} item
    * @returns {boolean}
    */
   sadd: (key: string, item: string): Promise<number> => {
     return new Promise((resolve, reject) => {
       client.sadd(key, item, (err, reply) => {
         if (err) {
           logger.error(err.message)
           reject(err)
         } else {
           resolve(reply)
         }
       })
     })
   },
   /**
    * Remove item from set;
    * item can be an array of items or a string;
    * rejects on error a boolean;
    * @async
    * @param {string} key
    * @param {string} item
    * @returns {boolean}
    */
   srem: (key: string, item: string): Promise<number> => {
     return new Promise((resolve, reject) => {
       client.srem(key, item, (err, reply) => {
         if (err) {
           logger.error(err.message)
           reject(err)
         } else {
           resolve(reply)
         }
       })
     })
   },
   /**
    * Check if item is a set member;
    * rejects on error a boolean;
    * @async
    * @param {string} key
    * @param {*} item
    * @returns {boolean}
    */
   sismember: (key: string, item: string): Promise<number> => {
     return new Promise((resolve, reject) => {
       client.sismember(key, item, (err, reply) => {
         if (err) {
           logger.error(err.message)
           reject(err)
         } else {
           resolve(reply)
         }
       })
     })
   },
   /**
    * Count of members in set;
    * rejects on error a boolean;
    * @async
    * @param {string} key
    * @returns {integer}
    */
   scard: (key: string): Promise<number> => {
     return new Promise((resolve, reject) => {
       client.scard(key, (err, reply) => {
         if (err) {
           logger.error(err.message)
           reject(err)
         } else {
           resolve(reply)
         }
       })
     })
   },
   /**
    * Retrieve all set members;
    * rejects on error a boolean;
    * @async
    * @param {string} key
    * @returns {array of strings}
    */
   smembers: (key: string): Promise<string[]> => {
     return new Promise((resolve, reject) => {
       client.smembers(key, (err, reply) => {
         if (err) {
           logger.error(err.message)
           reject(err)
         } else {
           resolve(reply)
         }
       })
     })
   },
   // HASH
   /**
    * Get value of a key in a hash
    * rejects on error a boolean;
    * @async
    * @param {string} hkey
    * @param {string} key
    * @returns {*}
    */
   hget: (hkey: string, key: string): Promise<string> => {
     return new Promise((resolve, reject) => {
       client.hget(hkey, key, (err, reply) => {
         if (err) {
           logger.error(err.message)
           reject(err)
         } else {
           resolve(reply)
         }
       })
     })
   },
   /**
    * Set value of a key in a hash;
    * rejects on error a boolean;
    * @async
    * @param {string} hkey
    * @param {string} key
    * @param {*} value
    * @returns {boolean}
    */
   hset: (hkey: string, key: string, value: string): Promise<number> => {
     return new Promise((resolve, reject) => {
       client.hset(hkey, key, value, (err, reply) => {
         if (err) {
           logger.error(err.message)
           reject(err)
         } else {
           resolve(reply)
         }
       })
     })
   },
   /**
    * Remove key in a hash;
    * rejects on error a boolean;
    * @async
    * @param {string} hkey
    * @param {string} key
    * @returns {boolean}
    */
   hdel: (hkey: string, key: string): Promise<number> => {
     return new Promise((resolve, reject) => {
       client.hdel(hkey, key, (err, reply) => {
         if (err) {
           logger.error(err.message)
           reject(err)
         } else {
           resolve(reply)
         }
       })
     })
   },
   /**
    * Check if key exists in hash;
    * rejects on error a boolean;
    * @async
    * @param {string} hkey
    * @param {string} key
    * @returns {boolean}
    */
   hexists: (hkey: string, key: string): Promise<number> => {
     return new Promise((resolve, reject) => {
       client.hexists(hkey, key, (err, reply) => {
         if (err) {
           logger.error(err.message)
           reject(err)
         } else {
           resolve(reply)
         }
       })
     })
   },
   /**
    * Get all key:value in a hash;
    * rejects on error a boolean;
    * @async
    * @param {string} hkey
    * @returns {object}
    */
   hgetall: (hkey: string): Promise<JsonType> => {
     return new Promise((resolve, reject) => {
       client.hgetall(hkey, (err, reply) => {
         if (err) {
           logger.error(err.message)
           reject(err)
         } else {
           resolve(reply)
         }
       })
     })
   }
 }
 
