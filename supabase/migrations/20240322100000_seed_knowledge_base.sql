-- Seed data for kb_tags
INSERT INTO kb_tags (id, name, slug, color) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Getting Started', 'getting-started', '#4CAF50'),
  ('22222222-2222-2222-2222-222222222222', 'FAQ', 'faq', '#2196F3'),
  ('33333333-3333-3333-3333-333333333333', 'Troubleshooting', 'troubleshooting', '#F44336'),
  ('44444444-4444-4444-4444-444444444444', 'Features', 'features', '#9C27B0');

-- Seed data for kb_articles
INSERT INTO kb_articles (id, title, description, slug, content, status) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Welcome to Our Platform',
    'A comprehensive guide to help you get started with our platform and understand its key features.',
    'welcome-to-our-platform',
    '# Welcome to Our Platform

This guide will help you get started with our platform. Here are the key things you need to know:

## Key Features
- Feature 1
- Feature 2
- Feature 3

## Next Steps
1. Set up your account
2. Configure your preferences
3. Start using the platform',
    'published'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Frequently Asked Questions',
    'Find answers to common questions about our platform, its features, and how to get started.',
    'frequently-asked-questions',
    '# Frequently Asked Questions

## General Questions

### Q: What is this platform?
A: This is a comprehensive platform that helps you manage your business needs.

### Q: How do I get started?
A: Follow our getting started guide to begin your journey.',
    'published'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Common Issues and Solutions',
    'A collection of common issues users might encounter and detailed solutions to resolve them.',
    'common-issues-and-solutions',
    '# Common Issues and Solutions

Here are some common issues you might encounter and how to resolve them:

## Issue 1
Description and solution...

## Issue 2
Description and solution...',
    'published'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Advanced Features Guide',
    'Explore our advanced features and learn how to leverage them for maximum benefit.',
    'advanced-features-guide',
    '# Advanced Features Guide

Learn about our advanced features and how to make the most of them.

## Feature 1
Detailed explanation...

## Feature 2
Detailed explanation...',
    'draft'
  );

-- Seed data for kb_article_tags
INSERT INTO kb_article_tags (article_id, tag_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444'); 