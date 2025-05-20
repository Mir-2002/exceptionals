import axios from 'axios';

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github.v3+json'
  }
});

githubApi.interceptors.request.use(config => {
  const githubToken = localStorage.getItem('githubToken');
  if (githubToken) {
    config.headers.Authorization = `token ${githubToken}`;
  }
  return config;
});

export const githubServices = {
  // Get repository metadata
  getRepository: (owner, repo) => 
    githubApi.get(`/repos/${owner}/${repo}`),
  
  // Get repository contents
  getRepositoryContents: (owner, repo, path = '', ref = 'main') => 
    githubApi.get(`/repos/${owner}/${repo}/contents/${path}`, { params: { ref } }),
  
  // Get repository languages
  getRepositoryLanguages: (owner, repo) => 
    githubApi.get(`/repos/${owner}/${repo}/languages`),
  
  // Parse GitHub URL to owner/repo
  parseGitHubUrl: (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'github.com') {
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2) {
          return {
            owner: pathParts[0],
            repo: pathParts[1]
          };
        }
      }
    } catch (e) {
      // Invalid URL
    }
    return null;
  }
};