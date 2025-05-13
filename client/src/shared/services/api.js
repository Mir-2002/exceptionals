import axios from 'axios';

const API_URL = import.meta.env.VITE_API_ENDPOINT || "http://localhost:5000";

// Set up axios with a base URL
const api = axios.create({
    baseURL: API_URL
});

// Add token to requests if it exists
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Upload a single file
export const uploadFile = async (file, projectName, skipItems) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_name', projectName);
    formData.append('skip_list', JSON.stringify(skipItems));
    
    return api.post('/api/projects/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// Upload multiple files (folder)
export const uploadFolder = async (files, projectName, skipItems) => {
    const formData = new FormData();
    
    files.forEach(file => {
        formData.append('files', file);
    });
    
    formData.append('project_name', projectName);
    formData.append('skip_list', JSON.stringify(skipItems));
    
    return api.post('/api/projects/upload-folder', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// Mock file upload for testing
export const mockUploadFile = async (file, projectName, skipItems) => {
    console.log('Pretending to upload file:', { file, projectName, skipItems });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Fake delay
    return { 
        data: { 
            id: 'mock-project-123',
            name: projectName,
            fileCount: 1,
            documentationUrl: '/documentation/mock-project-123' 
        } 
    };
};

// Mock folder upload for testing
export const mockUploadFolder = async (files, projectName, skipItems) => {
    console.log('Pretending to upload folder:', { fileCount: files.length, projectName, skipItems });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Fake delay
    return { 
        data: { 
            id: 'mock-project-456',
            name: projectName,
            fileCount: files.length,
            documentationUrl: '/documentation/mock-project-456' 
        } 
    };
};

// Upload a file with progress updates
export const uploadFileWithProgress = async (file, projectName, skipItems, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("project_name", projectName);
    formData.append("skip_list", JSON.stringify(skipItems || []));

    try {
        if (import.meta.env.DEV) {
            return await simulateFileUploadWithProgress(file, projectName, onProgress); // Fake it in dev
        }

        const response = await api.post('/api/projects/upload-file', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                if (onProgress) onProgress(percentCompleted);
            }
        });
        
        return response.data;
    } catch (error) {
        console.error("File upload failed:", error);
        throw error;
    }
};

// Upload a folder with progress updates
export const uploadFolderWithProgress = async (files, projectName, skipItems, onProgress) => {
    const formData = new FormData();
    
    files.forEach(file => {
        const relativePath = file.webkitRelativePath || file.name; // Keep folder structure
        formData.append("files", file);
        formData.append("paths", relativePath);
    });
    
    formData.append("project_name", projectName);
    formData.append("skip_list", JSON.stringify(skipItems || []));

    try {
        if (import.meta.env.DEV) {
            return await simulateFolderUploadWithProgress(files, projectName, onProgress); // Fake it in dev
        }

        const response = await api.post('/api/projects/upload-folder', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                if (onProgress) onProgress(percentCompleted);
            }
        });
        
        return response.data;
    } catch (error) {
        console.error("Folder upload failed:", error);
        throw error;
    }
};

// Upload a GitHub repo
export const uploadGitHubRepo = async (repoUrl, projectName, branch = 'main', skipItems) => {
    try {
        if (import.meta.env.DEV) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Fake delay
            return {
                success: true,
                message: `Repo ${repoUrl} imported successfully (mock)`,
                id: `project-${Date.now()}`,
                projectName
            };
        }

        const response = await api.post('/api/projects/import-github-repo', {
            repo_url: repoUrl,
            project_name: projectName,
            branch,
            skip_list: skipItems || []
        });
        
        return response.data;
    } catch (error) {
        console.error("GitHub repo import failed:", error);
        throw error;
    }
};

// Fake file upload with progress (for dev)
const simulateFileUploadWithProgress = async (file, projectName, onProgress) => {
    const totalSize = file.size;
    const chunkSize = totalSize / 10; // 10 steps
    let uploadedSize = 0;
    
    for (let i = 1; i <= 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Fake delay
        uploadedSize = Math.min(totalSize, chunkSize * i);
        const percent = Math.round((uploadedSize * 100) / totalSize);
        if (onProgress) onProgress(percent);
    }
    
    return {
        success: true,
        message: `File ${file.name} uploaded successfully (mock)`,
        id: `project-${Date.now()}`,
        projectName,
        fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type
        }
    };
};

// Fake folder upload with progress (for dev)
const simulateFolderUploadWithProgress = async (files, projectName, onProgress) => {
    let totalSize = 0;
    files.forEach(file => {
        totalSize += file.size;
    });
    
    const chunkSize = totalSize / 20; // 20 steps
    let uploadedSize = 0;
    
    for (let i = 1; i <= 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Fake delay
        uploadedSize = Math.min(totalSize, chunkSize * i);
        const percent = Math.round((uploadedSize * 100) / totalSize);
        if (onProgress) onProgress(percent);
    }
    
    return {
        success: true,
        message: `${files.length} files uploaded successfully (mock)`,
        id: `project-${Date.now()}`,
        projectName,
        filesInfo: files.map(file => ({
            name: file.name,
            path: file.webkitRelativePath || file.name,
            size: file.size,
            type: file.type
        }))
    };
};
