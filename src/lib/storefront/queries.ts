// =============================================================================
// SUNRISE — Storefront API query documents
// Path: src/lib/storefront/queries.ts
// Session: SBev.BC.Shopify.1
// =============================================================================

// ── FRAGMENTS ────────────────────────────────────────────────────────────
const IMAGE_FIELDS = /* GraphQL */ `
  fragment ImageFields on Image {
    id
    url
    altText
    width
    height
  }
`;

const MONEY_FIELDS = /* GraphQL */ `
  fragment MoneyFields on MoneyV2 {
    amount
    currencyCode
  }
`;

const PRODUCT_FIELDS = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    productType
    tags
    featuredImage {
      ...ImageFields
    }
    images(first: 10) {
      edges {
        node {
          ...ImageFields
        }
      }
    }
    variants(first: 50) {
      edges {
        node {
          id
          title
          availableForSale
          quantityAvailable
          price {
            ...MoneyFields
          }
          image {
            ...ImageFields
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
    priceRange {
      minVariantPrice {
        ...MoneyFields
      }
      maxVariantPrice {
        ...MoneyFields
      }
    }
  }
`;

// ── QUERIES ──────────────────────────────────────────────────────────────
export const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  ${IMAGE_FIELDS}
  ${MONEY_FIELDS}
  ${PRODUCT_FIELDS}
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductFields
    }
  }
`;

export const PRODUCTS_QUERY = /* GraphQL */ `
  ${IMAGE_FIELDS}
  ${MONEY_FIELDS}
  ${PRODUCT_FIELDS}
  query Products($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          ...ProductFields
        }
      }
    }
  }
`;

export const CART_QUERY = /* GraphQL */ `
  ${IMAGE_FIELDS}
  ${MONEY_FIELDS}
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      totalQuantity
      cost {
        subtotalAmount { ...MoneyFields }
        totalAmount { ...MoneyFields }
        totalTaxAmount { ...MoneyFields }
      }
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            cost {
              totalAmount { ...MoneyFields }
              subtotalAmount { ...MoneyFields }
            }
            merchandise {
              ... on ProductVariant {
                id
                title
                availableForSale
                price { ...MoneyFields }
                image { ...ImageFields }
                product {
                  id
                  handle
                  title
                }
              }
            }
          }
        }
      }
    }
  }
`;