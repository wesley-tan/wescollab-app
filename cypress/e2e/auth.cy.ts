describe('Authentication Tests', () => {
  beforeEach(() => {
    // Reset any previous auth state
    cy.clearLocalStorage()
    cy.clearCookies()
    
    // Visit the sign in page directly
    cy.visit('/auth/signin')
  })

  it('should allow sign in with non-wesleyan email', () => {
    // Mock the Supabase client
    cy.window().then((win) => {
      // @ts-ignore - we know this exists
      win.createSupabaseClient = () => ({
        auth: {
          signInWithOAuth: ({ provider, options }) => {
            // Instead of redirecting, we'll simulate a successful callback
            cy.visit('/auth/callback?code=test_code&provider=google')
            return Promise.resolve({ data: {}, error: null })
          },
          exchangeCodeForSession: (code: string) => {
            return Promise.resolve({
              data: {
                user: {
                  id: 'test_user_id',
                  email: 'test@gmail.com',
                  user_metadata: {
                    full_name: 'Test User',
                    avatar_url: 'https://example.com/avatar.jpg'
                  }
                }
              },
              error: null
            })
          }
        }
      })
    })

    // Mock the callback endpoint
    cy.intercept('GET', '/auth/callback*', {
      statusCode: 302,
      headers: {
        'Location': '/dashboard'
      }
    }).as('authCallback')

    // Click the sign in button
    cy.contains('Sign in with Google').click()

    // Wait for the callback and verify redirect
    cy.wait('@authCallback')
    cy.url().should('include', '/dashboard', { timeout: 10000 })
  })

  it('should allow sign in with wesleyan email', () => {
    // Mock the Supabase client
    cy.window().then((win) => {
      // @ts-ignore - we know this exists
      win.createSupabaseClient = () => ({
        auth: {
          signInWithOAuth: ({ provider, options }) => {
            // Instead of redirecting, we'll simulate a successful callback
            cy.visit('/auth/callback?code=test_code&provider=google')
            return Promise.resolve({ data: {}, error: null })
          },
          exchangeCodeForSession: (code: string) => {
            return Promise.resolve({
              data: {
                user: {
                  id: 'test_user_id',
                  email: 'test@wesleyan.edu',
                  user_metadata: {
                    full_name: 'Test User',
                    avatar_url: 'https://example.com/avatar.jpg'
                  }
                }
              },
              error: null
            })
          }
        }
      })
    })

    // Mock the callback endpoint
    cy.intercept('GET', '/auth/callback*', {
      statusCode: 302,
      headers: {
        'Location': '/dashboard'
      }
    }).as('authCallback')

    // Click the sign in button
    cy.contains('Sign in with Google').click()

    // Wait for the callback and verify redirect
    cy.wait('@authCallback')
    cy.url().should('include', '/dashboard', { timeout: 10000 })
  })

  it('should handle sign in errors gracefully', () => {
    // Mock the Supabase client
    cy.window().then((win) => {
      // @ts-ignore - we know this exists
      win.createSupabaseClient = () => ({
        auth: {
          signInWithOAuth: ({ provider, options }) => {
            // Instead of redirecting, we'll simulate a failed callback
            cy.visit('/auth/callback?code=test_code&provider=google')
            return Promise.resolve({ data: {}, error: null })
          },
          exchangeCodeForSession: (code: string) => {
            return Promise.resolve({
              data: { user: null },
              error: { message: 'Authentication failed' }
            })
          }
        }
      })
    })

    // Mock the callback endpoint with error
    cy.intercept('GET', '/auth/callback*', {
      statusCode: 302,
      headers: {
        'Location': '/auth/signin?error=auth_failed'
      }
    }).as('authCallback')

    // Click the sign in button
    cy.contains('Sign in with Google').click()

    // Wait for the callback and verify error
    cy.wait('@authCallback')
    cy.contains('Authentication Error:', { timeout: 10000 }).should('be.visible')
    cy.contains('Authentication failed').should('be.visible')
  })
}) 