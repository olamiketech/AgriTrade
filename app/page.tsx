import Navbar from '@/components/Navbar'
import Link from 'next/link'
import Image from 'next/image'
import { Shield, FileCheck, DollarSign, CheckCircle, ArrowRight, TrendingUp, Globe, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button' // Using new button component

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      <main className="pt-16">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-white border-b border-slate-200">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] pointer-events-none"></div>

          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Column - Content */}
              <div className="max-w-2xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-medium text-xs border border-emerald-100 mb-6">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Regulated Trade Finance Platform</span>
                </div>

                <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl mb-6">
                  Secure Global Trade <br />
                  <span className="text-emerald-700">Without risk.</span>
                </h1>

                <p className="text-lg leading-8 text-slate-600 mb-8">
                  AgriTrade Secure enables agricultural exporters to trade safely with verified international buyers. From deal creation to payment settlement, every step is auditable and protected.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-semibold h-12 px-8 text-base">
                      Start Trading Now
                    </Button>
                  </Link>
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base text-slate-700 border-slate-300 hover:bg-slate-50">
                      View Demo Platform
                    </Button>
                  </Link>
                </div>

                <div className="mt-10 flex items-center gap-x-6 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>FCA Compliant Structure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Bank-Grade Escrow</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Visual (Dashboard Mockup) */}
              <div className="relative hidden lg:block">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-100 to-cyan-100 rounded-2xl opacity-30 blur-2xl"></div>
                <div className="relative rounded-xl bg-slate-900 shadow-2xl border border-slate-700 overflow-hidden ring-1 ring-white/10">
                  <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <div className="mx-auto text-xs text-slate-500 font-mono">agritrade-secure.app/dashboard</div>
                  </div>
                  {/* Mock Dashboard Content */}
                  <div className="p-6 bg-slate-900 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
                        <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Export Value</div>
                        <div className="text-2xl font-bold text-white">$2,450,000</div>
                        <div className="text-emerald-500 text-xs flex items-center mt-1"><TrendingUp className="w-3 h-3 mr-1" /> +12% this month</div>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
                        <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Active Deals</div>
                        <div className="text-2xl font-bold text-white">8</div>
                        <div className="text-slate-400 text-xs mt-1">3 Pending Payment</div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-slate-200">Recent Transactions</span>
                        <span className="text-xs text-emerald-500">Verified</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                          <div className="flex flex-col">
                            <span className="text-white">Cocoa Shipment #4922</span>
                            <span className="text-slate-500 text-xs">To: UK Importers Ltd.</span>
                          </div>
                          <span className="text-emerald-400 font-mono">$124,000.00</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex flex-col">
                            <span className="text-white">Coffee Beans (Arabica)</span>
                            <span className="text-slate-500 text-xs">To: Hamburg Coffee GmBH</span>
                          </div>
                          <span className="text-amber-500 font-mono">Pending</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="bg-slate-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center mb-16">
              <h2 className="text-base font-semibold leading-7 text-emerald-600 uppercase tracking-wide">Enterprise Features</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Built for Institutional Trust
              </p>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                We replace chaotic email threads and PDF invoices with a single source of truth for every trade deal.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
                {/* Feature 1 */}
                <div className="relative bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-6">
                    <Globe className="w-6 h-6 text-emerald-700" />
                  </div>
                  <dt className="text-xl font-semibold leading-7 text-slate-900 mb-3">
                    Cross-Border Settlement
                  </dt>
                  <dd className="text-base leading-7 text-slate-600">
                    Payments are held in secure escrow until goods are verified. Exporters get paid faster; buyers get what they paid for.
                  </dd>
                </div>

                {/* Feature 2 */}
                <div className="relative bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-6">
                    <FileCheck className="w-6 h-6 text-cyan-700" />
                  </div>
                  <dt className="text-xl font-semibold leading-7 text-slate-900 mb-3">
                    Digital Documentation
                  </dt>
                  <dd className="text-base leading-7 text-slate-600">
                    Upload Bills of Lading, Phytosanitary Certs, and Origin Certs. Our AI verifies compliance automatically.
                  </dd>
                </div>

                {/* Feature 3 */}
                <div className="relative bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-6">
                    <Lock className="w-6 h-6 text-slate-700" />
                  </div>
                  <dt className="text-xl font-semibold leading-7 text-slate-900 mb-3">
                    Audit-Ready History
                  </dt>
                  <dd className="text-base leading-7 text-slate-600">
                    Every action is logged. Download comprehensive trade dossiers to satisfy bank compliance and regulatory checks.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-900 border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-3">
                <div className="opacity-80 grayscale">
                  <Image
                    src="/logo.png"
                    alt="AgriTrade Secure"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <span className="text-lg font-bold text-slate-300">AgriTrade Secure</span>
              </div>
              <div className="flex gap-8 text-sm text-slate-400">
                <a href="#" className="hover:text-white">Privacy Policy</a>
                <a href="#" className="hover:text-white">Terms of and Conditions</a>
                <a href="#" className="hover:text-white">Contact Support</a>
              </div>
              <p className="text-xs text-slate-600">
                © 2026 AgriTrade Secure. London, UK.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

