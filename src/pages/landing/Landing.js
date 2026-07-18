import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TruckIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
  BuildingOffice2Icon,
  ArrowRightIcon,
  CheckCircleIcon,
  Bars3Icon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const stats = [
  { value: '25+', label: 'Years of Service' },
  { value: '1,200+', label: 'Doctors & Chemists Served' },
  { value: '5,000+', label: 'Products Distributed' },
  { value: '30+', label: 'Cities Covered' },
];

const services = [
  {
    icon: TruckIcon,
    title: 'Pharmaceutical Distribution',
    description:
      'A reliable, temperature-controlled distribution network delivering genuine medicines and healthcare products on time, every time.',
  },
  {
    icon: UserGroupIcon,
    title: 'Doctor & Chemist Engagement',
    description:
      'Dedicated field teams building lasting relationships with doctors, chemists, and healthcare providers across the region.',
  },
  {
    icon: ClockIcon,
    title: 'Reliable Supply Chain',
    description:
      'Smart inventory planning and cycle-based replenishment ensure the right stock reaches the right place without delay.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Quality & Compliance',
    description:
      'Every product is sourced, stored, and handled to strict regulatory and quality standards you can trust.',
  },
];

const reasons = [
  'Trusted partner to leading pharmaceutical brands',
  'Transparent, technology-driven operations',
  'Wide and growing regional coverage',
  'On-time delivery with full traceability',
  'Experienced, professional field force',
  'Dedicated support for every partner',
];

function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="#top" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 text-white">
                <BuildingOffice2Icon className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-tight text-gray-900">
                DS Medical Agencies
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#services" className="hover:text-indigo-600 transition-colors">Services</a>
              <a href="#why" className="hover:text-indigo-600 transition-colors">Why Us</a>
              <a href="tel:+919876072518" className="hover:text-indigo-600 transition-colors">Contact</a>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Sign In
              </Link>
            </nav>

            <button
              className="md:hidden text-gray-600"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            <a href="#services" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-indigo-600">Services</a>
            <a href="#why" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-indigo-600">Why Us</a>
            <a href="tel:+919876072518" onClick={() => setMenuOpen(false)} className="block text-gray-600 hover:text-indigo-600">Contact</a>
            <Link to="/login" className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors">Sign In</Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-500">
        {/* Decorative blurred blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-violet-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-inset ring-white/25">
              <ShieldCheckIcon className="h-4 w-4" />
              Trusted Healthcare Distribution
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Delivering health,
              <br />
              <span className="text-violet-200">building trust.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-indigo-50/90 max-w-2xl">
              DS Medical Agencies is a leading pharmaceutical distribution partner -
              connecting quality medicines with doctors, chemists, and communities
              through a fast, dependable, and technology-driven supply chain.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50 transition-colors"
              >
                Get Started
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <a
                href="tel:+919876072518"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-base font-semibold text-white ring-1 ring-inset ring-white/30 hover:bg-white/20 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative">
          <svg className="block w-full h-12 sm:h-16 text-white" viewBox="0 0 1440 80" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,32 C360,80 1080,0 1440,48 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm"
              >
                <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                  {s.value}
                </div>
                <div className="mt-2 text-sm font-medium text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              What We Do
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              End-to-end pharmaceutical distribution services designed for reliability,
              transparency, and the health of the communities we serve.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white">
                  <service.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section id="why" className="bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                Why Partners Choose Us
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                For over two decades, healthcare providers have relied on DS Medical
                Agencies for consistency, integrity, and service that never compromises
                on quality.
              </p>
              <ul className="mt-8 grid sm:grid-cols-2 gap-4">
                {reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-3">
                    <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-violet-500" />
                    <span className="text-gray-700">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-500 p-8 sm:p-10 text-white shadow-xl">
                <ShieldCheckIcon className="h-10 w-10 text-white/90" />
                <blockquote className="mt-6 text-xl sm:text-2xl font-semibold leading-relaxed">
                  “Reliability isn't a promise we make - it's the standard we deliver on,
                  order after order.”
                </blockquote>
                <div className="mt-6 text-sm text-indigo-50/80">
                  - Satish Kumar, Founder & CEO
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-500 px-8 py-14 sm:px-16 sm:py-16 text-center shadow-xl">
            <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <h2 className="relative text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Partner with DS Medical Agencies
            </h2>
            <p className="relative mt-4 text-lg text-indigo-50/90 max-w-2xl mx-auto">
              Join a distribution network built on trust, precision, and care.
              Reach out to start a partnership.
            </p>
            <div className="relative mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="tel:+919876072518"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 text-white">
                  <BuildingOffice2Icon className="h-5 w-5" />
                </span>
                <span className="text-lg font-bold text-white">DS Medical Agencies</span>
              </div>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-400">
                Your trusted pharmaceutical distribution partner - delivering quality
                healthcare products with reliability and care.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Company</h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="#why" className="hover:text-white transition-colors">Why Us</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Get in Touch</h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-violet-400" />
                  <a href="tel:+919876072518" className="hover:text-white transition-colors">+91 98760 72518</a>
                </li>
                <li className="flex items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-violet-400" />
                  <a href="mailto:satish_chhabra0135@yahoo.com" className="hover:text-white transition-colors break-all">satish_chhabra0135@yahoo.com</a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-violet-400" />
                  <span>Tapa, Punjab, India</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} DS Medical Agencies. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
