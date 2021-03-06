import { FabrixService as Service } from '@fabrix/fabrix/dist/common'
import { omit, clone } from 'lodash'
import * as moment from 'moment'
import { COLLECTION_DISCOUNT_TYPE } from '../../enums'
import { COLLECTION_DISCOUNT_SCOPE } from '../../enums'
import { DISCOUNT_STATUS } from '../../enums'
/**
 * @module DiscountService
 * @description Discount Service
 */
export class DiscountService extends Service {
  publish(type, event, options: {save?: boolean, transaction?: any, include?: any} = {}) {
    if (this.app.services.EventsService) {
      options.include = options.include ||  [{
        model: this.app.models.EventItem.instance,
        as: 'objects'
      }]
      return this.app.services.EventsService.publish(type, event, options)
    }
    this.app.log.debug('spool-events is not installed, please install it to use publish')
    return Promise.resolve()
  }
  /**
   *
   * @param discount
   * @param options
   * @returns {Promise.<TResult>|*}
   */
  create(discount, options) {
    options = options || {}
    const Discount = this.app.models['Discount']

    let appliesTo = discount.applies_to || []

    if (discount.applies_to_id || discount.applies_to_model) {
      appliesTo.push({
        id: discount.applies_to_id,
        model: discount.applies_to_model
      })
      delete discount.applies_to_id
      delete discount.applies_to_model
    }
    delete discount.applies_to

    // Filter out bad requests
    appliesTo = appliesTo.filter(a => {
      if (a.model && a.id) {
        return a
      }
    })
    // make all the model match schema just in case it came through lowercase.
    appliesTo.map(a => {
      a.model = a.model.charAt(0).toUpperCase() + a.model.slice(1)
      return a
    })

    let resDiscount
    return Discount.create(discount, {transaction: options.transaction || null})
      .then(_discount => {
        if (!_discount) {
          throw new Error('Discount was not created')
        }
        resDiscount = _discount

        return Discount.sequelize.Promise.mapSeries(appliesTo, applicant => {

          if (this.app.models[applicant.model]) {
            return this.app.models[applicant.model].findById(applicant.id, {transaction: options.transaction || null})
              .then(_applicant => {
                if (!_applicant) {
                  throw new Error(`${ applicant.model } ${applicant.id} could not be found`)
                }
                return _applicant.addDiscount(resDiscount.id, {transaction: options.transaction || null})
              })
          }
          else {
            return
          }
        })
      })
      .then(() => {
        return resDiscount
      })

  }

  /**
   * @param identifier
   * @param discount
   * @param options
   * @returns {Promise.<TResult>|*}
   */
  update(identifier, discount, options) {
    options = options || {}
    const Discount = this.app.models['Discount']

    let resDiscount
    return Discount.resolve(identifier, {transaction: options.transaction || null})
      .then(_discount => {
        if (!_discount) {
          throw new Error('Discount did not resolve')
        }
        resDiscount = _discount
        return resDiscount.update(discount, {transaction: options.transaction || null})
      })
  }

  /**
   * @param identifier
   * @param options
   * @returns {Promise.<TResult>}
   */
  destroy(identifier, options) {
    options = options || {}
    const Discount = this.app.models['Discount']
    let resDiscount
    return Discount.resolve(identifier, {transaction: options.transaction || null})
      .then(_discount => {
        if (!_discount) {
          throw new Error('Discount did not resolve')
        }
        resDiscount = _discount
        return resDiscount.destroy({transaction: options.transaction || null})
      })
      .then(() => {
        return resDiscount
      })
  }

  /**
   *
   * @param identifier
   * @param options
   * @returns {Promise.<TResult>|*}
   */
  start(identifier, options) {
    options = options || {}
    const Discount = this.app.models['Discount']
    let resDiscount
    return Discount.resolve(identifier, {transaction: options.transaction || null})
      .then(_discount => {
        if (!_discount) {
          throw new Error('Discount did not resolve')
        }
        resDiscount = _discount
        return resDiscount
          .start({transaction: options.transaction || null})
          .save({transaction: options.transaction || null})
      })
      .then(() => {
        return resDiscount
      })
  }

  /**
   *
   * @param identifier
   * @param options
   * @returns {Promise.<TResult>|*}
   */
  expire(identifier, options) {
    options = options || {}
    const Discount = this.app.models['Discount']
    let resDiscount
    return Discount.resolve(identifier, {transaction: options.transaction || null})
      .then(_discount => {
        if (!_discount) {
          throw new Error('Discount did not resolve')
        }
        resDiscount = _discount
        return resDiscount
          .stop({transaction: options.transaction || null})
          .save({transaction: options.transaction || null})
      })
      .then(() => {
        return resDiscount
      })
  }


  /**
   *
   * @param obj:  cart/subscription Instance
   * @param collections
   * @param resolver
   * @param options
   * @returns {Promise.<T>}
   */
  calculateCollections(obj, collections, resolver, options: {[key: string]: any} = {}) {
    // Set the default
    const discountedLines = []
    let type

    // Resolve the instance: product, subscription, cart
    let resObj
    return resolver.resolve(obj, {transaction: options.transaction || null})
      .then(_obj => {
        if (!_obj) {
          throw new Error('Could not resolve instance and calculate collection discounts')
        }
        if (_obj instanceof this.app.models['Cart'].instance) {
          type = 'cart'
        }
        else if (_obj instanceof this.app.models['Subscription'].instance) {
          type = 'subscription'
        }
        else if (_obj instanceof this.app.models['Product'].instance) {
          type = 'product'
        }
        else {
          throw new Error('Instance must be either Cart, Subscription, or Product')
        }

        resObj = _obj

        // Loop through collection and apply discounts, stop if there are no line items
        collections.forEach(collection => {
          // If the collection doesn't have a discount ignore
          if (!(collection.discount_rate > 0) && !(collection.percentage > 0)) {
            return
          }

          // If object is a cart/subscription with line items and they are empty then ignore
          if (['cart', 'subscription'].indexOf(type) > -1 && resObj.line_items.length === 0) {
            return
          }

          // Set the default discounted line
          const discountedLine: {[key: string]: any} = {
            id: collection.id,
            model: 'collection',
            type: null,
            name: collection.title,
            scope: collection.discount_scope,
            price: 0
          }

          // if cart or subscription, add lines array for tracking
          if (['cart', 'subscription'].indexOf(type) > -1) {
            discountedLine.lines = []
          }

          // Set type variable and percentage/rate
          if (collection.discount_type === COLLECTION_DISCOUNT_TYPE.FIXED) {
            discountedLine.rate = collection.discount_rate
            discountedLine.type = COLLECTION_DISCOUNT_TYPE.FIXED
          }
          else if (collection.discount_type === COLLECTION_DISCOUNT_TYPE.PERCENTAGE) {
            discountedLine.percentage = collection.discount_percentage
            discountedLine.type = COLLECTION_DISCOUNT_TYPE.PERCENTAGE
          }
          // Determine Scope
          // if (collection.discount_scope === COLLECTION_DISCOUNT_SCOPE.GLOBAL) {

          // If cart or subscription
          if (['cart', 'subscription'].indexOf(type) > -1) {

            let publish = false

            const lineItems = resObj.line_items.map((item, index) => {
              // Search Exclusion
              if (collection.discount_product_exclude.indexOf(item.type) > -1) {
                return item
              }
              // Check if Individual Scope
              const inProducts = collection.products.some(product => product.id === item.product_id)
              if (collection.discount_scope === COLLECTION_DISCOUNT_SCOPE.INDIVIDUAL && inProducts === false) {
                return item
              }
              // const lineDiscountedLines = item.discounted_lines
              // Set the default Discounted Line
              const lineDiscountedLine = omit(clone(discountedLine), 'lines')

              if (discountedLine.type === COLLECTION_DISCOUNT_TYPE.FIXED) {
                lineDiscountedLine.price = discountedLine.rate
              }
              else if (discountedLine.type === COLLECTION_DISCOUNT_TYPE.PERCENTAGE) {
                lineDiscountedLine.price = (item.price * discountedLine.percentage)
              }

              const calculatedPrice = Math.max(0, item.calculated_price - lineDiscountedLine.price)
              const totalDeducted = Math.min(item.price, (item.price - (item.price - lineDiscountedLine.price)))
              // Publish this to the parent discounted lines
              publish = true
              item.discounted_lines.push(lineDiscountedLine)
              item.calculated_price = calculatedPrice
              item.total_discounts = item.total_discounts + totalDeducted
              discountedLine.price = discountedLine.price + totalDeducted
              discountedLine.lines.push(index)
              return item

            })

            // Set the mutated line items
            resObj.setLineItems(lineItems)

            if (publish) {
              // Add the discounted Line
              discountedLines.push(discountedLine)
            }
          }
          // If product
          else if (type === 'product') {
            if (collection.discount_product_exclude && collection.discount_product_exclude.indexOf(resObj.type) > -1) {
              return resObj
            }
            // Check if Individual Scope
            const inProducts = collection.products && collection.products.some(colProduct => colProduct.id === resObj.id)

            if (collection.discount_scope === COLLECTION_DISCOUNT_SCOPE.INDIVIDUAL && inProducts === false) {
              return resObj
            }

            // const lineDiscountedLines = item.discounted_lines
            // Set the default Discounted Line
            const lineDiscountedLine = omit(clone(discountedLine), 'lines')

            if (discountedLine.type === COLLECTION_DISCOUNT_TYPE.FIXED) {
              lineDiscountedLine.price = discountedLine.rate
            }
            else if (discountedLine.type === COLLECTION_DISCOUNT_TYPE.PERCENTAGE) {
              lineDiscountedLine.price = (resObj.price * discountedLine.percentage)
            }

            const calculatedPrice = Math.max(0, resObj.calculated_price - lineDiscountedLine.price)
            const totalDeducted = Math.min(resObj.price, (resObj.price - (resObj.price - lineDiscountedLine.price)))
            // Publish this to the parent discounted lines
            resObj.setCalculatedPrice(calculatedPrice)
            discountedLine.price = discountedLine.price + totalDeducted

            discountedLines.push(discountedLine)
          }
        })

        resObj.setDiscountedLines(discountedLines)
        return resObj
      })
  }

  /**
   *
   * @returns {Promise.<T>|*}
   */
  expireThisHour(options: {[key: string]: any} = {}) {
    const start = moment().startOf('hour')
    const end = start.clone().endOf('hour')
    const Discount = this.app.models['Discount']
    const errors = []
    let discountsTotal = 0

    this.app.log.debug('DiscountService.expireThisHour', start.format('YYYY-MM-DD HH:mm:ss'), end.format('YYYY-MM-DD HH:mm:ss'))

    return Discount.batch({
      where: {
        ends_at: {
          $gte: start.format('YYYY-MM-DD HH:mm:ss'),
          $lte: end.format('YYYY-MM-DD HH:mm:ss')
        },
        status: [DISCOUNT_STATUS.ENABLED, DISCOUNT_STATUS.DEPLETED]
      },
      regressive: true,
      transaction: options.transaction || null
    }, discounts => {
      return Discount.sequelize.Promise.mapSeries(discounts, discount => {
        return this.expire(discount, {transaction: options.transaction || null})
      })
        .then(results => {
          // Calculate Totals
          discountsTotal = discountsTotal + results.length
          return
        })
        .catch(err => {
          // errorsTotal++
          this.app.log.error(err)
          errors.push(err)
          return
        })
    })
      .then(discounts => {
        const results = {
          discounts: discountsTotal,
          errors: errors
        }
        this.app.log.info(results)
        this.app.services.EventsService.publish('discounts.end.complete', results)
        return results
      })
  }

  /**
   *
   * @returns {Promise.<TResult>|*}
   */
  startThisHour(options: {[key: string]: any} = {}) {
    const start = moment().startOf('hour')
    const end = start.clone().endOf('hour')
    const Discount = this.app.models['Discount']
    const errors = []
    let discountsTotal = 0

    this.app.log.debug('DiscountService.startThisHour', start.format('YYYY-MM-DD HH:mm:ss'), end.format('YYYY-MM-DD HH:mm:ss'))

    return Discount.batch({
      where: {
        starts_at: {
          $gte: start.format('YYYY-MM-DD HH:mm:ss'),
          $lte: end.format('YYYY-MM-DD HH:mm:ss')
        },
        status: DISCOUNT_STATUS.DISABLED
      },
      regressive: true,
      transaction: options.transaction || null
    }, discounts => {
      const Sequelize = Discount.sequelize
      return Sequelize.Promise.mapSeries(discounts, discount => {
        return this.start(discount, {transaction: options.transaction || null})
      })
        .then(results => {
          // Calculate Totals
          discountsTotal = discountsTotal + results.length
          return
        })
        .catch(err => {
          // errorsTotal++
          this.app.log.error(err)
          errors.push(err)
          return
        })
    })
      .then(discounts => {
        const results = {
          discounts: discountsTotal,
          errors: errors
        }
        this.app.log.info(results)
        this.app.services.EventsService.publish('discounts.start.complete', results)
        return results
      })
  }

  /**
   * Add Multiple products
   * @param discount
   * @param products
   * @param options
   * @returns {Promise.<*>}
   */
  addProducts(discount, products, options: {[key: string]: any} = {}) {
    if (!Array.isArray(products)) {
      products = [products]
    }
    const Sequelize = this.app.models['Discount'].sequelize
    // const addedProducts = []
    // Setup Transaction
    return Sequelize.transaction(t => {
      return Sequelize.Promise.mapSeries(products, product => {
        return this.addProduct(discount, product, {
          transaction: t
        })
      })
    })
  }
  /**
   *
   * @param discount
   * @param product
   * @param options
   * @returns {Promise.<TResult>}
   */
  addProduct(discount, product, options: {[key: string]: any} = {}) {
    const Discount = this.app.models['Discount']
    const Product = this.app.models['Product']

    let resDiscount, resProduct
    return Discount.resolve(discount, {transaction: options.transaction || null})
      .then(_discount => {
        if (!_discount) {
          throw new Error('Discount did not resolve')
        }
        resDiscount = _discount
        return Product.resolve(product, {transaction: options.transaction || null})
      })
      .then(_product => {
        if (!_product) {
          throw new Error('Product did not resolve')
        }
        resProduct = _product

        return resDiscount.hasProduct(resProduct.id, {transaction: options.transaction || null})
      })
      .then(hasProduct => {
        if (!hasProduct) {
          return resDiscount.addProduct(resProduct.id, {transaction: options.transaction || null})
        }
        return
      })
      .then(() => {
        return resProduct
      })
  }


  /**
   *
   * @param discount
   * @param product
   * @param options
   * @returns {Promise.<TResult>}
   */
  removeProduct(discount, product, options: {[key: string]: any} = {}) {
    const Discount = this.app.models['Discount']
    const Product = this.app.models['Product']

    let resDiscount, resProduct
    return Discount.resolve(discount, {transaction: options.transaction || null})
      .then(_discount => {
        if (!_discount) {
          throw new Error('Discount did not resolve')
        }
        resDiscount = _discount
        return Product.resolve(product, {transaction: options.transaction || null})
      })
      .then(_product => {
        if (!_product) {
          throw new Error('Product did not resolve')
        }
        resProduct = _product

        return resDiscount.hasProduct(resProduct.id, {transaction: options.transaction || null})
      })
      .then(hasProduct => {
        if (hasProduct) {
          return resDiscount.removeProduct(resProduct.id, {transaction: options.transaction || null})
        }
        return
      })
      .then(() => {
        return resProduct
      })
  }

  /**
   * Add Multiple customers
   * @param discount
   * @param customers
   * @param options
   * @returns {Promise.<*>}
   */
  addCustomers(discount, customers, options: {[key: string]: any} = {}) {
    if (!Array.isArray(customers)) {
      customers = [customers]
    }
    const Sequelize = this.app.models['Discount'].sequelize
    // const addedCustomers = []
    // Setup Transaction
    return Sequelize.transaction(t => {
      return Sequelize.Promise.mapSeries(customers, customer => {
        return this.addCustomer(discount, customer, {
          transaction: t
        })
      })
    })
  }
  /**
   *
   * @param discount
   * @param customer
   * @param options
   * @returns {Promise.<TResult>}
   */
  addCustomer(discount, customer, options: {[key: string]: any} = {}) {
    const Discount = this.app.models['Discount']
    const Customer = this.app.models['Customer']

    let resDiscount, resCustomer
    return Discount.resolve(discount, {transaction: options.transaction || null})
      .then(_discount => {
        if (!_discount) {
          throw new Error('Discount did not resolve')
        }
        resDiscount = _discount
        return Customer.resolve(customer, {transaction: options.transaction || null, create: false})
      })
      .then(_customer => {
        if (!_customer) {
          throw new Error('Customer did not resolve')
        }
        resCustomer = _customer

        return resDiscount.hasCustomer(resCustomer.id, {transaction: options.transaction || null})
      })
      .then(hasCustomer => {
        if (!hasCustomer) {
          return resDiscount.addCustomer(resCustomer.id, {transaction: options.transaction || null})
        }
        return
      })
      .then(() => {
        return resCustomer
      })
  }

  /**
   *
   * @param discount
   * @param customer
   * @param options
   * @returns {Promise.<TResult>}
   */
  removeCustomer(discount, customer, options) {
    options = options || {}
    const Discount = this.app.models['Discount']
    const Customer = this.app.models['Customer']

    let resDiscount, resCustomer
    return Discount.resolve(discount, {transaction: options.transaction || null})
      .then(_discount => {
        if (!_discount) {
          throw new Error('Discount did not resolve')
        }
        resDiscount = _discount
        return Customer.resolve(customer, {transaction: options.transaction || null, create: false})
      })
      .then(_customer => {
        if (!_customer) {
          throw new Error('Customer did not resolve')
        }
        resCustomer = _customer

        return resDiscount.hasCustomer(resCustomer.id, {transaction: options.transaction || null})
      })
      .then(hasCustomer => {
        if (hasCustomer) {
          return resDiscount.removeCustomer(resCustomer.id, {transaction: options.transaction || null})
        }
        return
      })
      .then(() => {
        return resCustomer
      })
  }

  /**
   *
   * @param discount
   * @param cart
   * @param options
   * @returns {Promise.<TResult>}
   */
  addCart(discount, cart, options) {
    options = options || {}
    const Discount = this.app.models['Discount']
    const Cart = this.app.models['Cart']

    let resDiscount, resCart
    return Discount.resolve(discount, {transaction: options.transaction || null})
      .then(_discount => {
        if (!_discount) {
          throw new Error('Discount did not resolve')
        }
        resDiscount = _discount
        return Cart.resolve(cart, {transaction: options.transaction || null})
      })
      .then(_cart => {
        if (!_cart) {
          throw new Error('Cart did not resolve')
        }
        resCart = _cart

        return resDiscount.hasCart(resCart.id, {transaction: options.transaction || null})
      })
      .then(hasCart => {
        if (!hasCart) {
          return resDiscount.addCart(resCart.id, {transaction: options.transaction || null})
        }
        return
      })
      .then(() => {
        return resCart
      })
  }

  /**
   *
   * @param discount
   * @param cart
   * @param options
   * @returns {Promise.<TResult>}
   */
  removeCart(discount, cart, options) {
    options = options || {}
    const Discount = this.app.models['Discount']
    const Cart = this.app.models['Cart']

    let resDiscount, resCart
    return Discount.resolve(discount, {transaction: options.transaction || null})
      .then(_discount => {
        if (!_discount) {
          throw new Error('Discount did not resolve')
        }
        resDiscount = _discount
        return Cart.resolve(cart, {transaction: options.transaction || null})
      })
      .then(_cart => {
        if (!_cart) {
          throw new Error('Cart did not resolve')
        }
        resCart = _cart

        return resDiscount.hasCart(resCart.id, {transaction: options.transaction || null})
      })
      .then(hasCart => {
        if (hasCart) {
          return resDiscount.removeCart(resCart.id, {transaction: options.transaction || null})
        }
        return
      })
      .then(() => {
        return resCart
      })
  }

  /**
   * Add Multiple collections
   * @param discount
   * @param collections
   * @param options
   * @returns {Promise.<*>}
   */
  addCollections(discount, collections, options) {
    options = options || {}
    if (!Array.isArray(collections)) {
      collections = [collections]
    }
    const Sequelize = this.app.models['Discount'].sequelize
    // const addedCollections = []
    // Setup Transaction
    return Sequelize.transaction(t => {
      return Sequelize.Promise.mapSeries(collections, collection => {
        return this.addCollection(discount, collection, {
          transaction: t
        })
      })
    })
  }
  /**
   *
   * @param discount
   * @param collection
   * @param options
   * @returns {Promise.<TResult>}
   */
  addCollection(discount, collection, options) {
    options = options || {}
    const Discount = this.app.models['Discount']
    const Collection = this.app.models['Collection']

    let resDiscount, resCollection
    return Discount.resolve(discount, {transaction: options.transaction || null})
      .then(_discount => {
        if (!_discount) {
          throw new Error('Discount did not resolve')
        }
        resDiscount = _discount
        return Collection.resolve(collection, {
          transaction: options.transaction || null,
          reject: true
        })
      })
      .then(_collection => {
        if (!_collection) {
          throw new Error('Collection did not resolve')
        }
        resCollection = _collection

        return resDiscount.hasCollection(resCollection.id, {transaction: options.transaction || null})
      })
      .then(hasCollection => {
        if (!hasCollection) {
          return resDiscount.addCollection(resCollection.id, {transaction: options.transaction || null})
        }
        return
      })
      .then(() => {
        return resCollection
      })
  }

  /**
   *
   * @param discount
   * @param collection
   * @param options
   * @returns {Promise.<TResult>}
   */
  removeCollection(discount, collection, options) {
    options = options || {}
    const Discount = this.app.models['Discount']
    const Collection = this.app.models['Collection']

    let resDiscount, resCollection
    return Discount.resolve(discount, {transaction: options.transaction || null})
      .then(_discount => {
        if (!_discount) {
          throw new Error('Discount did not resolve')
        }
        resDiscount = _discount
        return Collection.resolve(collection, {
          transaction: options.transaction || null,
          reject: true
        })
      })
      .then(_collection => {
        if (!_collection) {
          throw new Error('Collection did not resolve')
        }
        resCollection = _collection

        return resDiscount.hasCollection(resCollection.id, {transaction: options.transaction || null})
      })
      .then(hasCollection => {
        if (hasCollection) {
          return resDiscount.removeCollection(resCollection.id, {transaction: options.transaction || null})
        }
        return
      })
      .then(() => {
        return resCollection
      })
  }
}

