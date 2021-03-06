/**
 * Cart Configuration
 *
 * @see {@link https://github.com/CaliStyle/spool-cart}
 */
module.exports = {
  // The default Shop address (Nexus)
  nexus: {
    name: '',
    host: '',
    address: {
      address_1: '',
      address_2: '',
      address_3: '',
      company: '',
      city: '',
      province: '',
      country: '',
      postal_code: ''
    }
  },
  // Allow certain events
  allow: {
    // Allows a product to be destroyed, Recommended false
    destroy_product: false,
    // Allows a product variant to be destroyed, Recommended false
    destroy_variant: false
  },
  // The default currency used
  default_currency: 'USD',
  // The countries to load by default
  default_countries: ['USA'],
  // Orders
  orders: {
    // Restock default for refunded order items
    refund_restock: false,
    // The default function for an automatic order payment: manual, immediate
    payment_kind: 'immediate',
    // the default function for transaction kind: authorize, sale
    transaction_kind: 'authorize',
    // The default function for an automatic order fulfillment: manual, immediate
    fulfillment_kind: 'manual',
    // The amount of times a Order will retry failed transactions
    retry_attempts: 5,
    // The amount of days before a Order will cancel from failed transactions
    grace_period_days: 5
  },
  // Subscriptions
  subscriptions: {
    // The amount of times a Subscription will retry failed transactions
    retry_attempts: 5,
    // The amount of days before a Subscription will cancel from failed transactions
    grace_period_days: 5,
    // The amount of days before a subscription will renew that notice is given.
    renewal_notice_days: 3
  },
  // Transactions
  transactions: {
    // The amount of days before authorization expires
    authorization_exp_days: 5,
    // The amount of times a Transaction will retry failed
    retry_attempts: 5
  },
  // Emails that are allowed to send
  emails: {
    customerRetarget: false,
    customerAccountBalanceDeducted: false,
    customerAccountBalanceCredited: false,
    orderCreated: false,
    orderUpdated: false,
    orderPaid: false,
    orderFulfilled: false,
    orderRefunded: false,
    orderCancelled: false,
    sourceExpired: false,
    sourceWillExpire: false,
    sourceUpdated: false,
    subscriptionCreated: false,
    subscriptionUpdated: false,
    subscriptionActivated: false,
    subscriptionDeactivated: false,
    subscriptionCancelled: false,
    subscriptionWillRenew: false,
    subscriptionRenewed: false,
    subscriptionFailed: false,
    transactionFailed: false
  },
  notifications: {
    admin: {
      orderCreated: true
    }
  },
  // Events to allow "publish"
  events: {},
}
