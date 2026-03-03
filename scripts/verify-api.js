const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    // 1. Create Users
    const exporterEmail = `exp_${Date.now()}@test.com`
    const buyerEmail = `buy_${Date.now()}@test.com`
    // We assume these already exist or we just use the API to register them if needed.
    // Actually simpler to use the API to register so we get cookies.

    // Helper to fetch
    const baseUrl = 'http://localhost:3000'
    let exporterCookie = ''
    let buyerCookie = ''
    let adminCookie = ''

    // REGISTER EXPORTER
    console.log('--- Registering Exporter ---')
    let res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: exporterEmail, password: 'password123', role: 'EXPORTER', companyName: 'Exp Co', country: 'US' })
    })
    if (!res.ok) console.log('Register Exporter Failed', await res.text())

    // LOGIN EXPORTER
    res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: exporterEmail, password: 'password123' })
    })
    exporterCookie = res.headers.get('set-cookie')
    console.log('Exporter Logged In')

    // CREATE DEAL (No Terms)
    console.log('--- Testing Deal Creation (No Terms) ---')
    res = await fetch(`${baseUrl}/api/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': exporterCookie },
        body: JSON.stringify({
            buyerEmail: buyerEmail,
            productDetails: 'Test',
            quantity: 100,
            price: 1000,
            currency: 'USD',
            deliveryTerms: 'FOB'
            // termsAccepted missing
        })
    })
    console.log('No Terms Response:', res.status) // Expect 400

    // CREATE DEAL (With Terms)
    console.log('--- Testing Deal Creation (With Terms) ---')
    res = await fetch(`${baseUrl}/api/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': exporterCookie },
        body: JSON.stringify({
            buyerEmail: buyerEmail,
            productDetails: 'Test',
            quantity: 100,
            price: 1000,
            currency: 'USD',
            deliveryTerms: 'FOB',
            termsAccepted: true
        })
    })
    const dealData = await res.json()
    console.log('With Terms Response:', res.status, dealData.deal?.id) // Expect 200
    const dealId = dealData.deal?.id

    // REGISTER BUYER
    console.log('--- Registering Buyer ---')
    res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: buyerEmail, password: 'password123', role: 'BUYER', companyName: 'Buy Co', country: 'US' })
    })

    // LOGIN BUYER
    res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: buyerEmail, password: 'password123' })
    })
    buyerCookie = res.headers.get('set-cookie')
    console.log('Buyer Logged In')

    // ACCEPT DEAL (No Terms)
    console.log('--- Testing Deal Acceptance (No Terms) ---')
    res = await fetch(`${baseUrl}/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': buyerCookie },
        body: JSON.stringify({ status: 'ACCEPTED' }) // termsAccepted missing
    })
    console.log('No Terms Accept Response:', res.status) // Expect 400

    // ACCEPT DEAL (With Terms)
    console.log('--- Testing Deal Acceptance (With Terms) ---')
    res = await fetch(`${baseUrl}/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': buyerCookie },
        body: JSON.stringify({ status: 'ACCEPTED', termsAccepted: true })
    })
    console.log('With Terms Accept Response:', res.status) // Expect 200

    // VERIFY INTRODUCTION RECORD
    console.log('--- Verifying Database Records ---')
    const introRecord = await prisma.introductionRecord.findFirst({
        where: { initialTradeId: dealId }
    })
    console.log('Introduction Created:', !!introRecord)

    // ADMIN CHECK
    console.log('--- Admin Check ---')
    res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin_test@example.com', password: 'password123' })
    })
    adminCookie = res.headers.get('set-cookie')

    res = await fetch(`${baseUrl}/api/admin/circumvention`, {
        method: 'GET',
        headers: { 'Cookie': adminCookie }
    })
    const adminData = await res.json()
    console.log('Admin Dashboard Introductions:', adminData.introductions?.length)

}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect())
