# Setting up your blog (thasha10.github.io)

You do this once. After that, you only write posts in a web editor.

## Part 1. Put the site online (about 15 minutes)

1. Sign in at github.com as **thasha10**.
2. Click the **+** at the top right, then **New repository**.
   - Repository name: `thasha10.github.io` (exactly this)
   - Choose **Public**
   - Click **Create repository**
3. In the new repository, open **Settings**, then **Pages** (left menu). Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Go back to the **Code** tab and click **uploading an existing file**.
5. Unzip the folder you downloaded. Drag **everything inside it** into the GitHub page, including the hidden items `.github` and `.pages.yml`. Click **Commit changes**.
   - Do not upload the `node_modules` or `dist` folders if you ever see them.
   - If `.github` or `.pages.yml` did not upload (some computers hide them), create them by hand:
     **Add file**, then **Create new file**. For the file name type `.github/workflows/deploy.yml` and paste in the contents of `setup/deploy.yml.txt`. Commit. Repeat with the name `.pages.yml` and the contents of `setup/pages.yml.txt`.
6. Open the **Actions** tab. A run called **Deploy site** starts. When it shows a green tick (1 to 2 minutes), your site is live at **https://thasha10.github.io**.
   - If it shows a red cross because it ran before step 3, open the run and click **Re-run all jobs**.

## Part 2. Writing posts

1. Go to **app.pagescms.org** and sign in with GitHub. Install the Pages CMS app for your account when it asks, and choose the `thasha10.github.io` repository.
2. Open **Posts**, then **Add an entry**. Fill in:
   - **Title**
   - **Filename**: type a short English address with dashes, for example `my-first-poem` (this becomes the page address)
   - **Language**: English or Tamil
   - **Category**, **Publish date**, **Tags**, an optional **Cover image**, and the **Text**
3. Click **Save**. The post appears on the site in about 1 to 2 minutes.

**Same piece in both languages:** create two posts, one English and one Tamil. Give both the same **Pair key** (for example `rose-poem`). Each shows only in its own language, with a link to the other version.

**Scheduling:** set the publish date in the future. The site rebuilds every night at midnight Sri Lanka time and the post appears on its date. GitHub pauses scheduled runs in a repository that has had no activity for 60 days, which posting regularly prevents.

**Drafts:** tick **Keep as draft** and the post stays hidden until you untick it.

**Tags:** open **Tags list** in the editor and add a line for each new tag, with its English and Tamil names. A tag missing from that list still works, but only shows its English key.

**About page:** open **About page** in the editor and write the English and Tamil text.

**Poems:** please test your first poem. If the line breaks come out wrong in the editor, tell me and I will change the text field.

**Sample posts:** the 9 sample posts in the `posts` folder are placeholders. Delete them in the editor once you publish your own.

## Part 3. Reader counts and comments

Both are free services that you connect by editing the file `site.json` in your repository. To edit it, open the file on GitHub, click the pencil icon, change the value between the quotes and click **Commit changes**.

**Reader counts (GoatCounter)**
1. Sign up at goatcounter.com and choose a site code, for example `thasha`.
2. In GoatCounter, open **Settings** and tick **Allow adding visitor counts on your website**.
3. In `site.json`, set `"goatcounter": "thasha"` (your code).
4. The number appears on each post page. GoatCounter updates it with a delay of up to four hours. It counts page views, not separate people.

**Comments without a login (Cusdis)**
1. Sign up at cusdis.com and add a website with the domain `thasha10.github.io`.
2. Copy the **App ID** it shows you.
3. In `site.json`, set `"cusdis": "paste-the-app-id-here"`.
4. Readers can comment with or without a name. Every comment waits for your approval in the Cusdis dashboard. When I checked, the free plan allowed 1 website and 100 approved comments a month, so confirm the current limits when you sign up.

Until you fill in these two values, the count and the comment box are simply not shown.

## Part 4. Moving to your own domain later

1. Buy the domain from a registrar where you control the account, and turn on auto-renew.
2. In your repository, open **Settings**, then **Pages**, and type the domain under **Custom domain**. GitHub shows the DNS records to add at your registrar.
3. Add those records at the registrar, wait for GitHub to check them, then tick **Enforce HTTPS**.
4. In `site.json`, change `"url"` to the new address.
5. Create a new GoatCounter and Cusdis site entry for the new domain if the services ask for it.

Your old `thasha10.github.io` address then redirects to the new one.

## Notes

- The repository is public, so your post files, including drafts, can be seen by anyone who looks.
- Instagram has no share-by-link. On phones, readers can use the **More** button.
- Facebook and Instagram links in the footer come from `site.json`.
