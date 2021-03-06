
import * as joi from 'joi'
export const source = joi.object().keys({
  id: joi.number(),
  account_foreign_id: joi.any(),
  account_foreign_key: joi.any(),
  gateway: joi.string()
}).unknown()
