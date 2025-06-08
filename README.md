# 🚨 **BETA RELEASE** 🚨

> **This is a beta version. Expect frequent updates and potential changes.**  

# NERO Decentralized Polls

[![Beta Version](https://img.shields.io/badge/version-beta-orange.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  

NERO decentralized polls - where your opinion matters.  
Follow the steps below for a quick and easy setup.


* [Roadmap](#roadmap)
* [Demo](#demo)

## Roadmap

```mermaid
%% Roadmap Timeline (Gantt Chart)
gantt
    title SMART dPolls Roadmap
    dateFormat  YYYY-MM-DD
    axisFormat %b %d

    section Waves
    Wave 1 (Ideathon)          :a1, 2024-04-14, 14d
    Wave 2 (Foundation)        :a2, after a1, 14d
    Wave 3 (Core Features)     :a3, after a2, 14d
    Wave 4 (Enhancements)      :a4, after a3, 14d
    Wave 5 (Security & Control):a5, after a4, 14d
    Wave 6 (Polishing)         :a6, after a5, 14d
    Ending Ceremony            :milestone, 2024-07-13, 0d

    section Features
    Frontend Landing Page     :b1, 2024-04-28, 14d
    Poll Smart Contract v2.0  :b2, 2024-04-28, 14d
    Creating Polls            :b3, 2024-04-28, 14d
    Poll Smart Contract v3.0  :b4, 2024-05-12, 14d
    Submitting Responses      :b5, 2024-05-12, 14d
    Viewing Results           :b7, 2024-05-12, 14d
    Gamification              :b8, 2024-05-12, 14d
    Leaderboard               :b9, 2024-05-12, 14d
    Claiming Rewards          :b10, 2024-05-12, 14d
    Funding Polls             :b11, 2024-05-12, 14d
    Poll Smart Contract v4.0  :b12, 2024-05-26, 14d
    Poll Administration Revamp :b13, 2024-05-26, 14d
    Page Navigation Revamp     :b14, 2024-05-26, 14d
    View Result Beautification :b15, 2024-05-26, 14d
    Poll Response Analysis    :b16, 2024-05-26, 14d
    TBD                       :b17, 2024-06-09, 14d
    TBD                       :b18, 2024-06-23, 14d
```

## Demo

Try out our demo site at:  
[https://dpolls.vercel.app/](https://dpolls.vercel.app/)

## 📋 Prerequisites

- **Node.js**: `v22.4.1`
- **Yarn**: `v3.8.3`

## 🚀 Setup Instructions

### 1. Install Dependencies

Run the following command in your terminal:

```bash
yarn install
```

If install fails, try to delete yarn.lock, the run `yarn install`.

### 2. Start the Server

After installing the dependencies, start the development server with:

```bash
yarn dev
```

### 3. Deployment (vercel)

```bash
vercel project
vercel link --yes --project dpolls
yarn build:demo && vercel build --prod && vercel --prebuilt --prod
```
### 3. Deployment (Beta)

```bash

vercel project
vercel link --yes --project dpolls-beta
yarn build:demo && vercel build --prod && vercel --prebuilt --prod
```

## 📄 License

This project is distributed under the [MIT License](LICENSE).
