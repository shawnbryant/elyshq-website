# ELYSHQ Landing Page & Hosting Guide

This directory contains the source code for your website **elyshq.com**, featuring your software Unire and telling your unique story as a developer and music artist.

## 🚀 How to Launch Online (Step-by-Step)

### Step 1: Create a GitHub Repository
1. Go to [github.com](https://github.com) and log in.
2. Click **New Repository**. Name it `elyshq-website`. Keep it public or private.
3. In your terminal, initialize and push this folder:
   ```bash
   cd "/Users/shawnbryant/Desktop/Apps/elyshq-website"
   git init
   git add .
   git commit -m "Initial commit of landing page"
   git branch -M main
   git remote add origin https://github.com/your-username/elyshq-website.git
   git push -u origin main
   ```

### Step 2: Deploy to Cloudflare Pages (Free)
Since your domain `elyshq.com` is registered and managed on **Cloudflare**, hosting it on Cloudflare Pages is the fastest and most secure method.

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com).
2. On the left sidebar, click **Workers & Pages**.
3. Click **Create Application** -> Select the **Pages** tab -> **Connect to Git**.
4. Authenticate with GitHub and select your `elyshq-website` repository.
5. Click **Begin setup**:
   * **Project Name**: `elyshq-website`
   * **Production Branch**: `main`
   * **Framework Preset**: None (it's a simple HTML site!)
6. Click **Save and Deploy**. Cloudflare will build and host your site on a `.pages.dev` subdomain in seconds.

### Step 3: Link your Custom Domain (elyshq.com)
1. In your Cloudflare Pages project dashboard, click the **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Input `elyshq.com` (or `www.elyshq.com`).
4. **Since you bought the domain directly through Cloudflare Registrar**, Cloudflare will automatically detect this and prompt you to configure the DNS records with one click. Simply click **Activate domain** or confirm.
5. Cloudflare automatically sets up the DNS CNAME records. Your site is now live at `https://elyshq.com` with a free SSL certificate!

---

## 🔗 How to Hook Up Payments
1. Go to your **Lemon Squeezy Dashboard** -> **Products**.
2. Copy the **Checkout Link** for Unire.
3. Open `index.html` and search for the button:
   ```html
   <a href="https://elysian.lemonsqueezy.com/checkout/buy/unire?embed=1" class="btn-buy lemonsqueezy-button">Buy Unire</a>
   ```
4. Replace `https://elysian.lemonsqueezy.com/checkout/buy/unire?embed=1` with your actual Lemon Squeezy checkout link (keep `?embed=1` at the end to make it load in a smooth overlay modal without leaving your site!).
5. Commit and push the changes:
   ```bash
   git add index.html
   git commit -m "Update checkout link"
   git push
   ```
   *Cloudflare Pages will automatically rebuild and deploy your site in ~10 seconds!*
