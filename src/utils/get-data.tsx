"use server";

import { Octokit } from "octokit";
import { remark } from "remark";
import html from "remark-html";

function getDayString(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function getThread(id: string) {
  const thread = await octokit.rest.activity.getThread({
    thread_id: Number(id),
  });

  return {
    id: thread.data.id,
    title: thread.data.subject.title,
    url: thread.data.subject.url,
    type: thread.data.subject.type,
    reason: thread.data.reason,
    lastest_comment_url: thread.data.subject.latest_comment_url,
  };
}

const markdownRenderer = remark().use(html);

async function getPullRequest(id: number) {
  const pr = await octokit.rest.issues.get({
    owner: "vllm-project",
    repo: "vllm",
    issue_number: id,
  });

  return {
    id: pr.data.id,
    title: pr.data.title,
    body: pr.data.body,
    state: pr.data.state,
    url: pr.data.html_url,
  };
}

async function getComments(id: number) {
  const comments = await octokit.rest.issues.listComments({
    owner: "vllm-project",
    repo: "vllm",
    issue_number: id,
  });

  return comments.data.map((comment) => {
    return {
      id: comment.id,
      body: comment.body,
      url: comment.html_url,
      author: comment.user!.login,
      authorAvatarUrl: comment.user!.avatar_url,
    };
  });
}

async function getComment(id: number) {
  const comment = await octokit.rest.issues.getComment({
    owner: "vllm-project",
    repo: "vllm",
    comment_id: id,
  });

  return {
    id: comment.data.id,
    body: comment.data.body,
    url: comment.data.html_url,
    author: comment.data.user!.login,
    authorAvatarUrl: comment.data.user!.avatar_url,
  };
}

async function getMyNotifications() {
  const notifications = await octokit.paginate(
    octokit.rest.activity.listRepoNotificationsForAuthenticatedUser,
    {
      owner: "vllm-project",
      repo: "vllm",
      all: true,
      since: getDayString(7),
      per_page: 100,
    }
  );

  return notifications.map((notification, i) => {
    return {
      id: notification.id,
      unread: notification.unread,
      reason: notification.reason,
      updated_at: notification.updated_at,
      last_read_at: notification.last_read_at,
      prev_id: i > 0 ? notifications[i - 1].id : null,
      next_id: i < notifications.length - 1 ? notifications[i + 1].id : null,
      subject: {
        title: notification.subject.title,
        url: notification.subject.url,
        latest_comment_url: notification.subject.latest_comment_url,
        type: notification.subject.type,
      },
    };
  });
}

export {
  getMyNotifications,
  getThread,
  getPullRequest,
  getComment,
  getComments,
};
