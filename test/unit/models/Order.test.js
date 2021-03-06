'use strict'
/* global describe, it */
const assert = require('assert')

describe('Order Model', () => {
  let Order, OrderItem, Transaction, OrderService
  it('should exist', () => {
    assert(global.app.api.models['Order'])
    Order = global.app.models['Order']
    OrderItem = global.app.models['OrderItem']
    Transaction = global.app.models['Transaction']
    OrderService = global.app.services['OrderService']
  })
  it('should resolve an order instance', (done) => {
    Order.resolve(Order.build({}))
      .then(order => {
        assert.ok(order instanceof Order.instance)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it('should resolve Subscribe Immediately', (done) => {
    let resOrder
    Order.create({
      fulfillment_kind: 'immediate',
      has_subscription: true,
      total_price: 10,
      total_items: 1,
      transactions: [
        {
          kind: 'sale',
          status: 'success',
          amount: 5
        },
        {
          kind: 'capture',
          status: 'success',
          amount: 5
        }
      ]
    }, {
      include: [{
        model: Transaction.instance,
        as: 'transactions'
      }]
    })
    // resOrder.set('transactions', [
    //   {
    //     kind: 'sale',
    //     status: 'success',
    //     amount: 5
    //   },
    //   {
    //     kind: 'capture',
    //     status: 'success',
    //     amount: 5
    //   }
    // ])

    // resOrder.save()
      .then((order) => {
        resOrder = order
        return resOrder.resolveSendImmediately()
      })
      .then(subscribe => {
        assert.equal(subscribe, true)
        return global.app.models['Transaction'].destroy({where: {order_id: resOrder.id}})
      })
      .then(() => {
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it('should not resolve Subscribe Immediately', (done) => {
    let resOrder
    Order.create({
      fulfillment_kind: 'immediate',
      has_subscription: true,
      total_price: 10,
      total_items: 1,
      transactions: [
        {
          kind: 'sale',
          status: 'success',
          amount: 5
        },
        {
          kind: 'capture',
          status: 'failure',
          amount: 5
        }
      ]
    }, {
      include: [{
        model: Transaction.instance,
        as: 'transactions'
      }]
    })
    // resOrder.set('transactions', [
    //   {
    //     kind: 'sale',
    //     status: 'success',
    //     amount: 5
    //   },
    //   {
    //     kind: 'capture',
    //     status: 'failure',
    //     amount: 5
    //   }
    // ])
    // resOrder.save()
      .then((order) => {
        resOrder = order
        return resOrder.resolveSendImmediately()
      })
      .then(subscribe => {
        assert.equal(subscribe, false)
        return global.app.models['Transaction'].destroy({where: {order_id: resOrder.id}})
      })
      .then(() => {
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it('should resolve Fulfill Immediately', (done) => {
    let resOrder
    Order.create({
      fulfillment_kind: 'immediate',
      total_price: 10,
      total_items: 1,
      transactions: [
        {
          kind: 'sale',
          status: 'success',
          amount: 5
        },
        {
          kind: 'capture',
          status: 'success',
          amount: 5
        }
      ]
    }, {
      include: [{
        model: Transaction.instance,
        as: 'transactions'
      }]
    })
    // resOrder.set('transactions', [
    //   {
    //     kind: 'sale',
    //     status: 'success',
    //     amount: 5
    //   },
    //   {
    //     kind: 'capture',
    //     status: 'success',
    //     amount: 5
    //   }
    // ])
    // resOrder.save()
      .then((order) => {
        resOrder = order
        return resOrder.resolveSendImmediately()
      })
      .then(subscribe => {
        assert.equal(subscribe, true)
        return global.app.models['Transaction'].destroy({where: {order_id: resOrder.id}})
      })
      .then(() => {
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it('should not resolve Fulfill Immediately because of failure', (done) => {
    let resOrder
    Order.create({
      fulfillment_kind: 'immediate',
      total_price: 10,
      total_items: 1,
      transactions: [
        {
          kind: 'sale',
          status: 'success',
          amount: 5
        },
        {
          kind: 'capture',
          status: 'failure',
          amount: 5
        }
      ]
    }, {
      include: [{
        model: Transaction.instance,
        as: 'transactions'
      }]
    })
    // resOrder.set('transactions', [
    //   {
    //     kind: 'sale',
    //     status: 'success',
    //     amount: 5
    //   },
    //   {
    //     kind: 'capture',
    //     status: 'failure',
    //     amount: 5
    //   }
    // ])
    // resOrder.save()
      .then((order) => {
        resOrder = order
        return resOrder.resolveSendImmediately()
      })
      .then(subscribe => {
        assert.equal(subscribe, false)
        return global.app.models['Transaction'].destroy({where: {order_id: resOrder.id}})
      })
      .then(() => {
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it('should not resolve Fulfill Immediately because of manual', (done) => {
    let resOrder
    Order.create({
      fulfillment_kind: 'manual',
      total_price: 10,
      total_items: 1,
      transactions: [
        {
          kind: 'sale',
          status: 'success',
          amount: 5
        },
        {
          kind: 'capture',
          status: 'success',
          amount: 5
        }
      ]
    }, {
      include: [{
        model: Transaction.instance,
        as: 'transactions'
      }]
    })
    // resOrder.set('transactions', [
    //   {
    //     kind: 'sale',
    //     status: 'success',
    //     amount: 5
    //   },
    //   {
    //     kind: 'capture',
    //     status: 'success',
    //     amount: 5
    //   }
    // ])
    // resOrder.save()
      .then((order) => {
        resOrder = order
        return resOrder.resolveSendImmediately()
      })
      .then(subscribe => {
        assert.equal(subscribe, false)
        return global.app.models['Transaction'].destroy({where: {order_id: resOrder.id}})
      })
      .then(() => {
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it('should not resolve Fulfill Immediately because of manual and failure', (done) => {
    let resOrder
    Order.create({
      fulfillment_kind: 'manual',
      total_price: 10,
      total_items: 1,
      transactions: [
        {
          kind: 'sale',
          status: 'success',
          amount: 5
        },
        {
          kind: 'capture',
          status: 'failure',
          amount: 5
        }
      ]
    }, {
      include: [{
        model: Transaction.instance,
        as: 'transactions'
      }]
    })
    // resOrder.set('transactions', [
    //   {
    //     kind: 'sale',
    //     status: 'success',
    //     amount: 5
    //   },
    //   {
    //     kind: 'capture',
    //     status: 'failure',
    //     amount: 5
    //   }
    // ])
    // resOrder.save()
      .then((order) => {
        resOrder = order
        return resOrder.resolveSendImmediately()
      })
      .then(subscribe => {
        assert.equal(subscribe, false)
        return global.app.models['Transaction'].destroy({where: {order_id: resOrder.id}})
      })
      .then(() => {
        done()
      })
      .catch(err => {
        done(err)
      })
  })

  it('should auto fulfill order when financial_status is updated to paid and fulfillment is immediate', (done) => {
    let resOrder
    Order.create({
      shop_id: 1,
      customer_id: 1,
      fulfillment_kind: 'immediate',
      total_price: 10,
      total_items: 1,
      transactions: [
        {
          kind: 'sale',
          status: 'success',
          amount: 5
        },
        {
          kind: 'capture',
          status: 'failure',
          amount: 5
        }
      ],
      fulfillments: [
        {
          service: 'manual'
        }
      ]
    }, {
      include: [{
        model: Transaction.instance,
        as: 'transactions'
      },{
        model: OrderItem.instance,
        as: 'order_items',
        include: [ global.app.models['Fulfillment'].instance ]
      },{
        model: global.app.models['Fulfillment'].instance,
        as: 'fulfillments',
        include: [
          {
            model: OrderItem.instance,
            as: 'order_items'
          }
        ]
      },{
        model: global.app.models['Event'].instance,
        as: 'events'
      }]
    })
    // resOrder.set('transactions', [
    //   {
    //     kind: 'sale',
    //     status: 'success',
    //     amount: 5
    //   },
    //   {
    //     kind: 'capture',
    //     status: 'failure',
    //     amount: 5
    //   }
    // ])
    // resOrder.set('fulfillments', [
    //   {
    //     service: 'manual'
    //   }
    // ])
    // return resOrder.save()
      .then(order => {
        resOrder = order
        assert.equal(resOrder.financial_status, 'pending')
        assert.equal(resOrder.fulfillment_status, 'pending')
        // Add Order Item
        return resOrder.createOrder_item(
          {
            product_id: 1,
            product_handle: 'makerbot-replicator',
            variant_id: 1,
            price: 10,
            sku: 'printer-w-123',
            type: '3D Printer',
            fulfillable_quantity: 1,
            fulfillment_service: 'manual',
            quantity: 1,
            max_quantity: -1,
            requires_subscription: true,
            requires_shipping: false,
            fulfillment_id: resOrder.fulfillments[0].id
          }
        )
          .then(() => {
            return resOrder.reload()
          })
      })
      .then(() => {
        const retry = resOrder.transactions.filter(transaction => transaction.status === 'failure')[0]
        return global.app.services.TransactionService.retry(retry)
      })
      .then(transaction => {
        return resOrder.reload()
      })
      .then(() => {
        assert.equal(resOrder.financial_status, 'paid')
        assert.equal(resOrder.fulfillment_status, 'fulfilled')
        done()
      })
      .catch(err => {
        done(err)
      })
  })

  it('should allow to add items to pending authorize/sale transaction', (done) => {
    let resOrder
    Order.create({
      shop_id: 1,
      customer_id: 1,
      fulfillment_kind: 'manual',
      transaction_kind: 'authorize',
      payment_kind: 'manual',
      transactions: [
        {
          kind: 'authorize',
          status: 'pending',
          amount: 0
        }
      ],
      fulfillments: [
        {
          service: 'manual'
        }
      ]
    }, {
      include: [{
        model: Transaction.instance,
        as: 'transactions'
      },{
        model: OrderItem.instance,
        as: 'order_items'
      },{
        model: global.app.models['Fulfillment'].instance,
        as: 'fulfillments',
        include: [
          {
            model: OrderItem.instance,
            as: 'order_items'
          }
        ]
      },{
        model: global.app.models['Event'].instance,
        as: 'events'
      }]
    })
    // resOrder.set('transactions', [
    //   {
    //     kind: 'authorize',
    //     status: 'pending',
    //     amount: 0
    //   },
    // ])

    // return resOrder.save()
      .then(order => {
        resOrder = order
        assert.equal(resOrder.financial_status, 'pending')
        assert.equal(resOrder.fulfillment_status, 'pending')
        return OrderService.addItem(resOrder, {product_id: 2, quantity: 1})
          .then(() => {
            return resOrder.reload()
          })
      })
      .then(order => {
        assert.equal(resOrder.financial_status, 'pending')
        assert.equal(resOrder.fulfillment_status, 'pending')
        assert.equal(resOrder.total_pending_fulfillments, 1)
        assert.equal(resOrder.total_pending, 100000)
        assert.equal(resOrder.total_price, 100000)
        assert.equal(resOrder.total_due, 100000)
        assert.equal(resOrder.transactions.length, 1)
        assert.equal(resOrder.transactions[0].status, 'pending')
        assert.equal(resOrder.transactions[0].kind, 'authorize')
        assert.equal(resOrder.transactions[0].amount, 100000)

        return OrderService.addItem(resOrder, {product_id: 2, quantity: 1})
          .then(() => {
            return resOrder.reload()
          })
      })
      .then((order) => {
        assert.equal(resOrder.financial_status, 'pending')
        assert.equal(resOrder.fulfillment_status, 'pending')
        assert.equal(resOrder.total_pending_fulfillments, 1)
        assert.equal(resOrder.total_pending, 200000)
        assert.equal(resOrder.total_price, 200000)
        assert.equal(resOrder.total_due, 200000)
        assert.equal(resOrder.transactions.length, 1)
        assert.equal(resOrder.transactions[0].status, 'pending')
        assert.equal(resOrder.transactions[0].kind, 'authorize')
        assert.equal(resOrder.transactions[0].amount, 200000)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
  it('should resolve transactions', (done) => {
    let resOrder
    Order.create({
      shop_id: 1,
      customer_id: 1,
      fulfillment_kind: 'manual',
      transaction_kind: 'authorize',
      payment_kind: 'manual',
      transactions: [
        {
          kind: 'authorize',
          status: 'pending',
          amount: 0
        }
      ]
    }, {
      include: [{
        model: Transaction.instance,
        as: 'transactions'
      }]
    })
    // resOrder.set('transactions', [
    //   {
    //     kind: 'authorize',
    //     status: 'pending',
    //     amount: 0
    //   },
    // ])
    // resOrder.save()
      .then((order) => {
        resOrder = order
        return resOrder.resolveTransactions()
      })
      .then(() => {
        assert.equal(resOrder.transactions.length, 1)
        done()
      })
      .catch(err => {
        done(err)
      })
  })
})
