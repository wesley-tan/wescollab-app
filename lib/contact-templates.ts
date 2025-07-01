import { Post } from '@/types/post'

// Contact template data structure
export interface ContactTemplateData {
  post: Post
  applicantName?: string
  customMessage?: string
}

// Email template configurations
export interface EmailTemplate {
  subject: string
  body: string
  type: 'inquiry' | 'application' | 'follow_up'
}

// Generate email templates based on role type and context
export function generateEmailTemplates(data: ContactTemplateData): EmailTemplate[] {
  const { post, applicantName = "[Your Name]", customMessage = "" } = data
  const templates: EmailTemplate[] = []

  // Template 1: General Inquiry
  templates.push({
    type: 'inquiry',
    subject: `Inquiry about ${post.roleTitle} at ${post.company}`,
    body: `Hi there,

I hope this email finds you well! I'm ${applicantName}, a student at Wesleyan University, and I'm very interested in the ${post.roleTitle} opportunity at ${post.company} that I found on WesCollab.

${customMessage || `I'm excited about this role because it aligns perfectly with my interests in ${post.roleType.toLowerCase().replace('_', ' ')} opportunities. I'd love to learn more about the position and discuss how my skills and enthusiasm could contribute to your team.`}

Could we schedule a brief call or meeting to discuss this opportunity further? I'm flexible with timing and happy to work around your schedule.

Thank you for your time and consideration. I look forward to hearing from you!

Best regards,
${applicantName}

---
Found via WesCollab - Wesleyan University Venture Board`
  })

  // Template 2: Formal Application
  templates.push({
    type: 'application',
    subject: `Application for ${post.roleTitle} - ${applicantName}`,
    body: `Dear Hiring Team,

I am writing to formally apply for the ${post.roleTitle} position at ${post.company} posted on WesCollab.

As a Wesleyan University student, I am particularly drawn to this ${post.roleType.toLowerCase().replace('_', ' ')} opportunity because:

• ${customMessage || `The role aligns with my academic background and career interests`}
• I'm eager to contribute to ${post.company}'s mission and growth
• This position offers valuable learning and development opportunities

I have attached my resume and would welcome the opportunity to discuss how my skills and passion align with your needs. I am available for an interview at your convenience.

Thank you for considering my application. I look forward to the possibility of joining your team.

Sincerely,
${applicantName}

---
Application submitted via WesCollab - Wesleyan University Venture Board`
  })

  // Template 3: Quick Follow-up (for after initial contact)
  templates.push({
    type: 'follow_up',
    subject: `Following up on ${post.roleTitle} opportunity`,
    body: `Hi,

I hope you're doing well! I wanted to follow up on my previous inquiry about the ${post.roleTitle} position at ${post.company}.

${customMessage || `I remain very interested in this opportunity and would love to continue our conversation. If you need any additional information from me, please don't hesitate to ask.`}

I'm still very excited about the possibility of contributing to your team and would appreciate any updates you might have.

Thank you again for your time!

Best,
${applicantName}

---
Via WesCollab - Wesleyan University Venture Board`
  })

  return templates
}

// Generate pre-filled mailto URL
export function generateMailtoUrl(
  email: string, 
  template: EmailTemplate,
  ccEmails?: string[]
): string {
  // Properly encode subject and body for mailto URL
  const subject = encodeURIComponent(template.subject)
  const body = encodeURIComponent(template.body.replace(/\n/g, '%0A'))
  
  let url = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`
  
  if (ccEmails && ccEmails.length > 0) {
    url += `&cc=${encodeURIComponent(ccEmails.join(','))}`
  }
  
  return url
}

// Generate SMS URL (for mobile devices)
export function generateSmsUrl(
  phoneNumber: string,
  post: Post,
  applicantName: string = "[Your Name]"
): string {
  const message = `Hi! I'm ${applicantName}, a Wesleyan student interested in the ${post.roleTitle} role at ${post.company}. Could we chat about this opportunity? Thanks!`
  
  // Clean phone number (remove spaces, dashes, parentheses)
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)\.]/g, '')
  
  // For iOS: sms:number&body=message
  // For Android: sms:number?body=message
  // We'll use the more universal format
  return `sms:${cleanPhone}?body=${encodeURIComponent(message)}`
}

// Generate phone call URL
export function generatePhoneUrl(phoneNumber: string): string {
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)\.]/g, '')
  return `tel:${cleanPhone}`
}

// Generate WhatsApp URL (if available)
export function generateWhatsAppUrl(
  phoneNumber: string,
  post: Post,
  applicantName: string = "[Your Name]"
): string {
  const message = `Hi! I'm ${applicantName}, a Wesleyan University student. I saw your ${post.roleTitle} posting at ${post.company} on WesCollab and I'm very interested. Could we discuss this opportunity? Thanks!`
  
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)\.]/g, '')
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

// Generate LinkedIn message URL (if we have LinkedIn profile)
export function generateLinkedInUrl(
  companyName: string,
  roleTitle: string,
  applicantName: string = "[Your Name]"
): string {
  const message = `Hi! I'm ${applicantName}, a Wesleyan University student interested in the ${roleTitle} opportunity at ${companyName}. I'd love to connect and learn more about this role. Thanks!`
  
  // LinkedIn messaging requires being connected or having LinkedIn Premium
  // This creates a search URL instead
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName)}&origin=GLOBAL_SEARCH_HEADER`
}

// Main contact action generator
export interface ContactAction {
  type: 'email' | 'sms' | 'call' | 'whatsapp' | 'linkedin'
  label: string
  url: string
  icon: string
  primary?: boolean
  description: string
}

export function generateContactActions(
  post: Post,
  applicantName: string = "[Your Name]",
  customMessage?: string
): ContactAction[] {
  const actions: ContactAction[] = []
  const templateData: ContactTemplateData = { post, applicantName, customMessage }

  // Email actions (if email available)
  if (post.contactEmail) {
    const templates = generateEmailTemplates(templateData)
    
    // Primary email action (inquiry)
    actions.push({
      type: 'email',
      label: 'Send Quick Inquiry',
      url: generateMailtoUrl(post.contactEmail, templates[0]),
      icon: '✉️',
      primary: true,
      description: 'Pre-filled email with professional inquiry'
    })

    // Formal application email
    actions.push({
      type: 'email', 
      label: 'Send Application',
      url: generateMailtoUrl(post.contactEmail, templates[1]),
      icon: '📝',
      description: 'Pre-filled formal application email'
    })
  }

  // Phone actions (if phone available)
  if (post.contactPhone) {
    // Call action
    actions.push({
      type: 'call',
      label: 'Call Now',
      url: generatePhoneUrl(post.contactPhone),
      icon: '📞',
      primary: post.preferredContactMethod === 'phone',
      description: 'Direct phone call'
    })

    // SMS action  
    actions.push({
      type: 'sms',
      label: 'Send Text',
      url: generateSmsUrl(post.contactPhone, post, applicantName),
      icon: '💬',
      description: 'Pre-filled SMS message'
    })

    // WhatsApp action (assuming phone might support WhatsApp)
    actions.push({
      type: 'whatsapp',
      label: 'WhatsApp',
      url: generateWhatsAppUrl(post.contactPhone, post, applicantName),
      icon: '📱',
      description: 'Message via WhatsApp'
    })
  }

  // LinkedIn action (always available)
  actions.push({
    type: 'linkedin',
    label: 'Find on LinkedIn',
    url: generateLinkedInUrl(post.company, post.roleTitle, applicantName),
    icon: '💼',
    description: 'Search for company contacts on LinkedIn'
  })

  return actions
}

// Utility to get primary contact action
export function getPrimaryContactAction(post: Post, applicantName?: string): ContactAction | null {
  const actions = generateContactActions(post, applicantName)
  return actions.find(action => action.primary) || actions[0] || null
}

// Contact analytics (for tracking which methods are most effective)
export interface ContactEvent {
  postId: string
  contactType: ContactAction['type'] 
  timestamp: Date
  userAgent?: string
}

export function trackContactEvent(event: Omit<ContactEvent, 'timestamp'>): ContactEvent {
  const fullEvent: ContactEvent = {
    ...event,
    timestamp: new Date()
  }
  
  // In a real app, you'd send this to analytics
  console.log('Contact event tracked:', fullEvent)
  
  return fullEvent
}

// Helper to determine best contact method based on preferences
export function getRecommendedContactMethod(post: Post): ContactAction['type'] {
  // Priority based on user preference and availability
  if (post.preferredContactMethod === 'email' && post.contactEmail) {
    return 'email'
  }
  
  if (post.preferredContactMethod === 'phone' && post.contactPhone) {
    return 'call'
  }
  
  if (post.preferredContactMethod === 'both') {
    // Default to email for professional settings
    return post.contactEmail ? 'email' : (post.contactPhone ? 'call' : 'linkedin')
  }
  
  // Fallback logic
  if (post.contactEmail) return 'email'
  if (post.contactPhone) return 'call'
  return 'linkedin'
} 