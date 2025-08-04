#!/bin/bash

# Navigate to the project directory
cd /var/www/dakka.me

# Initialize git repository (if not already done)
git init

# Configure git (replace with your details)
git config user.name "AS2812"
git config user.email "your-email@example.com"

# Add all files to git
git add .

# Commit the changes
git commit -m "Initial commit of Dakka Project"

# Add the GitHub repository as a remote
git remote add origin https://github.com/AS2812/tv.git

# Push to GitHub
# Note: You'll need to enter your GitHub credentials
git push -u origin master

echo "Project successfully uploaded to GitHub!"
