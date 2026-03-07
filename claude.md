# CLAUDE.md

## Project Overview

First Million is an AI-assisted personal finance tracking application designed to help early-income earners in Indonesia achieve their first **1 billion IDR net worth milestone**.

The application helps users build financial awareness by tracking income, expenses, assets, and financial progress over time.

The product focuses on:

- Financial awareness
- Expense tracking
- Net worth growth
- AI-powered financial insights

Target users:

- Fresh graduates
- Freelancers
- Early-career employees
- Income range: **5–15 million IDR per month**

The product is initially built as a **lean MVP** to validate product-market fit.

---

# Product Vision

The mission of First Million is:

> Help people understand where their money goes and build a realistic path toward their first 1 billion rupiah.

The application focuses on:

- simplicity
- habit building
- long-term financial growth

This is **NOT**:

- a trading platform
- a crypto speculation app
- a get-rich-quick system

It is a **financial awareness and habit building tool.**

---

# MVP Scope

The MVP focuses only on **core financial tracking**.

Core features:

1. User authentication
2. Financial onboarding
3. Transaction tracking
4. Asset tracking
5. Debt tracking
6. Net worth calculation
7. Financial dashboard
8. AI-generated financial insights
9. Goal tracking toward 1 billion IDR

Features intentionally **excluded from MVP**:

- WhatsApp bot
- OCR receipt scanning
- Investment marketplace
- Referral system
- Social sharing
- Advanced gamification
- Bank integrations

These may be implemented **after product-market fit validation**.

---

# Core Product Flow

User journey:

1. User registers an account
2. User completes financial onboarding
3. User inputs transactions (income and expenses)
4. User records debts and investments
5. System calculates financial summaries
6. Dashboard displays financial progress
7. AI generates financial insights

Usage loop:

Input → Track → Analyze → Improve

---

# Financial Concepts Used

The system calculates several financial metrics.

### Saving Rate

Saving Rate measures how much income is saved.

Saving Rate = (Income − Expense) / Income

---

### Net Worth

Net Worth represents a user's total financial position.

Net Worth = Total Assets − Total Liabilities

Where:

Total Assets include:

- Current savings
- Investment value

Total Liabilities include:

- Outstanding debts

---

### Financial Milestones

The application tracks progress toward major financial milestones:

- 10 million IDR
- 50 million IDR
- 100 million IDR
- 250 million IDR
- 500 million IDR
- 1 billion IDR

These milestones help motivate long-term saving behavior.

---

# System Architecture

The system uses a simple modern web architecture.

Backend:

- Node.js
- NestJS

Database:

- PostgreSQL

ORM:

- Prisma

---

# Database Core Models

Primary entities:

- Users
- FinancialProfiles
- Transactions
- Categories
- Debts
- DebtPayments
- Investments
- InvestmentTransactions
- AssetPrices
- FinancialSnapshots

---

# Transactions Model

Transactions represent **all income and expense records**.

Fields:

- type (income | expense)
- amount
- category
- transaction_date
- note

Debt payments and investment transactions reference transactions to ensure all money movements are recorded.

---

# Debt Tracking

Debt tracking helps users understand outstanding liabilities.

Debts contain:

- debt name
- total amount
- interest rate
- due date

DebtPayments record repayments.

Remaining debt is calculated as:

Remaining Debt = Total Debt − Sum(DebtPayments)

---

# Investment Tracking

Investments track assets owned by the user.

Examples:

- gold
- stocks
- crypto
- mutual funds

InvestmentTransactions record buy or sell actions.

Portfolio value is calculated using:

Total Units × Latest Asset Price

AssetPrices store market price history.

---

# Financial Snapshots

FinancialSnapshots capture periodic financial summaries.

Example snapshot metrics:

- total income
- total expense
- saving rate
- net worth
- investment value
- outstanding debt

Snapshots allow:

- historical analysis
- progress tracking
- AI insight generation

---

# AI Guidelines

AI is used only for **financial insights and behavior analysis**.

AI may provide:

- spending pattern insights
- saving habit feedback
- milestone progress analysis
- financial improvement suggestions

AI must **NOT**:

- promise financial returns
- give speculative investment advice
- guarantee financial outcomes

AI responses must remain:

- educational
- analytical
- neutral

---

# Coding Principles

The codebase must follow these principles.

### Simplicity

Avoid unnecessary complexity.

Prefer straightforward implementations.

### Readability

Code should be understandable by other developers.

### Modularity

Business logic should be separated from controllers.

### Type Safety

TypeScript should be used strictly across the entire codebase.

### Scalability Awareness

The architecture should allow future expansion without heavy refactoring.

---

# Development Priorities

Feature development priority:

1. Core financial tracking
2. Accurate financial calculations
3. Clear user experience
4. Reliable data storage
5. Performance

AI features should only be implemented **after the core financial system works reliably**.

---

# Security Principles

Financial data is sensitive.

The system must:

- hash user passwords
- protect user financial data
- follow secure API design
- avoid storing unnecessary financial documents

---

# Future Expansion

Potential future features:

- WhatsApp transaction logging
- OCR receipt scanning
- automated financial reports
- smart budgeting suggestions
- advanced investment portfolio tracking
- AI financial coaching
- community saving challenges

These features should only be added **after validating real user demand**.

---

# Development Philosophy

This project follows a **lean startup methodology**.

Build → Launch → Learn → Improve

Avoid overengineering.

Focus on solving a **real financial awareness problem for early earners**.

The primary goal of the MVP is to **validate real user value**, not to build a complex financial platform.
