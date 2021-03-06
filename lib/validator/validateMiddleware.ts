import * as joi from 'joi'
import { cartSpoolMiddleware } from '../schemas'

export const validateMiddleware = {
  config(middleware) {
    return new Promise((resolve, reject) => {
      joi.validate(middleware, cartSpoolMiddleware, (err, value) => {
        if (err) {
          return reject(new TypeError('config.web.middleware: ' + err))
        }
        return resolve(value)
      })
    })
  },
}
