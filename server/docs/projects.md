import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../../../shared/services/api';

const Dashboard = () => { comprehensive project management functionality including creation, retrieval, updates, deletion, structure analysis, exclusion management, and ZIP file uploads. All endpoints require authentication.
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');st file and folder.
  const [filter, setFilter] = useState('all');
## Base URL
  {/* Add Create Project Modal state */}
  const [showCreateModal, setShowCreateModal] = useState(false);
http://127.0.0.1:8000/api/projects
  const navigate = useNavigate();

  useEffect(() => {uthentication
    let isMounted = true;
    ts require a Bearer token in the Authorization header:
    const fetchProjects = async () => {
      try {
        setLoading(true);ation: Bearer <your_jwt_token>
        const response = await projectsAPI.getAllProjects();
        
        if (isMounted) {
          setProjects(response?.data || []);
          setError(null);
        }
      } catch (err) {
        console.log('Failed to load projects');
        if (isMounted) {the authenticated user.
          setProjects([]);
          setError(null); ST /projects`
        }
      } finally {
        if (isMounted) {
          setLoading(false);st Body:**
        }
      }son
    };
    ame": "My Python Project",
    fetchProjects();A sample Python project for documentation generation",
    : [],
    return () => {luded_files": []
      isMounted = false;
    };```
  }, []);

  // Filter projects based on search term and filter
  const filteredProjects = projects.filter(project => {son
    if (!project) return false;
    
    const matchesSearch = project.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || project.status === filter;scription": "A sample Python project for documentation generation",
    return matchesSearch && matchesFilter;  "excluded_directories": [],
  });
1-01T00:00:00Z",
  const handleDeleteProject = async (id, e) => {f86cd799439012",
    e.preventDefault();essage": "Project created successfully",
    e.stopPropagation();
    files": 0,
    if (!confirm('Are you sure you want to delete this project?')) {ocessing_status": "Not Started"
      return;
    }
    
    try {
      await projectsAPI.deleteProject(id);
      setProjects(projects.filter(project => project.id !== id));
    } catch (error) {ject name cannot exceed 100 characters
      console.error('Failed to delete project:', error);oject name must be unique for the user
    }- Description cannot be empty or whitespace
  };ion cannot exceed 500 characters

  const handleCreateProject = async (projectData) => {
    try {
      const response = await projectsAPI.createProject(projectData);ad Request` - Validation errors or duplicate project name
      const newProject = response.data;d` - Missing or invalid token
      nvalid input format
      // Navigate to project details page
      navigate(`/project/${newProject.id}`);
      
      // Refresh projects list
      setProjects([...projects, newProject]);
    } catch (error) {t information by project ID.
      console.error('Failed to create project:', error);
    }/projects/{project_id}`
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Your Projects</h1>
        
        {/* <Link 00 OK`
          to="/upload-selection"
          className="bg-yellow-400 hover:bg-yellow-500 text-sky-800 font-semibold px-8 py-2.5 rounded-lg 
                   transition-all duration-300 transform hover:scale-105 hover:shadow-md flex items-center justify-center"
        >: "507f1f77bcf86cd799439011",
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />generation",
          </svg>
          Uploads": [],
        </Link> */}1-01T00:00:00Z",
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-sky-800 font-semibold px-8 py-2.5 rounded-lg 
                   transition-all duration-300 transform hover:scale-105 hover:shadow-md flex items-center justify-center"
        >g_status": "In Progress"
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Projectses:**
        </button>
      </div>est` - Invalid project ID format
      
      {/* Search and filter */}ot access other user's project
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}nformation.
            onChange={(e) => setSearchTerm(e.target.value)}
          />oint:** `PATCH /projects/{project_id}`
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute right-3 top-2.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        
        <selectstring) - MongoDB ObjectId of the project
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Projects</option>
          <option value="complete">Completed</option>e",
          <option value="processing">Processing</option>on"
          <option value="failed">Failed</option>
        </select>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>11",
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>Name",
          </svg>dated project description",
        </div>
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">0:00Z",
          {filteredProjects.map(project => (cd799439012",
            <Linkt updated successfully",
              key={project.id}
              to={`/project/${project.id}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200"rogress",
            >
              <div className="p-6"> Project Name",
                <div className="flex items-center justify-between mb-2">dated project description"
                  <h2 className="text-xl font-bold text-gray-800 line-clamp-1">{project.name}</h2>
                  {project.status === 'complete' && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Completed
                    </span>
                  )}
                  {project.status === 'processing' && (valid project ID, validation errors, or duplicate name
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Processingnnot update other user's project
                    </span>` - Project not found
                  )}
                  {project.status === 'failed' && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      Failed
                    </span>
                  )}associated files.
                </div>
                
                <p className="text-gray-600 mb-4 text-sm line-clamp-2">{project.description || 'No description available'}</p>
                d
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>` (string) - MongoDB ObjectId of the project
                  {new Date(project.created_at).toLocaleDateString()}
                </div>** `200 OK`
                
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={(e) => handleDeleteProject(project.id, e)}7bcf86cd799439011",
                    className="text-red-500 hover:text-red-700 text-sm mr-4"
                  >
                    Delete
                  </button>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Details →
                  </button>quest` - Invalid project ID format
                </div>
              </div>
            </Link>Project not found
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg">ject Structure
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />the folder and file structure of a project as a tree.
          </svg>
          <h3 className="mt-4 text-xl font-medium text-gray-900">No projects yet</h3>Endpoint:** `GET /projects/{project_id}/structure`
          <p className="mt-1 text-gray-500">Start by uploading your first project to get documentation generated</p>
          <div className="mt-6">red


























































































export default Dashboard;};  );    </div>      )}        </div>          </div>            </form>              </div>                </button>                  Create Project                >                  className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"                  type="submit"                <button                </button>                  Cancel                >                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"                  onClick={() => setShowCreateModal(false)}                  type="button"                <button              <div className="flex justify-end space-x-3">              </div>                </select>                  <option value="zip_file">ZIP File</option>                  <option value="single_file">Single File</option>                >                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"                  name="type"                <select                </label>                  Project Type                <label className="block text-sm font-medium text-gray-700 mb-2">              <div className="mb-4">              </div>                />                  rows="3"                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"                  name="description"                <textarea                </label>                  Description                <label className="block text-sm font-medium text-gray-700 mb-2">              <div className="mb-4">              </div>                />                  required                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"                  name="name"                  type="text"                <input                </label>                  Project Name                <label className="block text-sm font-medium text-gray-700 mb-2">              <div className="mb-4">            }}>              setShowCreateModal(false);              handleCreateProject(projectData);              };                type: formData.get('type')                description: formData.get('description'),                name: formData.get('name'),              const projectData = {              const formData = new FormData(e.target);              e.preventDefault();            <form onSubmit={(e) => {                        <h2 className="text-xl font-bold mb-4">Create New Project</h2>          <div className="bg-white rounded-lg p-6 w-full max-w-md">        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">      {showCreateModal && (      {/* Create Project Modal */}      )}        </div>          </div>            </Link>              Create your first project              </svg>                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">            >              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"              to="/upload-selection"            <Link 
**Path Parameters:**

- `project_id` (string) - MongoDB ObjectId of the project

**Query Parameters:**

- `use_default_exclusions` (boolean, optional) - Apply default exclusions to common files/folders (default: true)

**Response:** `200 OK`

```json
{
  "project_id": "507f1f77bcf86cd799439011",
  "project_name": "My Python Project",
  "root": {
    "name": "root",
    "type": "folder",
    "excluded": false,
    "default_exclusion": false,
    "inherited_exclusion": false,
    "children": [
      {
        "name": "src",
        "type": "folder",
        "excluded": false,
        "default_exclusion": false,
        "inherited_exclusion": false,
        "children": [
          {
            "name": "main.py",
            "type": "file",
            "size": 1024,
            "processed": true,
            "id": "507f1f77bcf86cd799439013",
            "excluded": false,
            "default_exclusion": false,
            "inherited_exclusion": false
          }
        ]
      }
    ]
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid project ID format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot access other user's project
- `404 Not Found` - Project not found

---

### 6. Update Project Exclusions

Sets which directories and files to exclude from project documentation.

**Endpoint:** `POST /projects/{project_id}/exclusions`

**Authentication:** Required

**Path Parameters:**

- `project_id` (string) - MongoDB ObjectId of the project

**Request Body:**

```json
{
  "project_id": "507f1f77bcf86cd799439011",
  "excluded_directories": ["tests", "docs", "__pycache__"],
  "excluded_files": ["setup.py", "conftest.py", "test_*.py"]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Exclusions updated successfully",
  "project_id": "507f1f77bcf86cd799439011"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid project ID format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot update other user's project
- `404 Not Found` - Project not found

---

### 7. Get Project Exclusions

Retrieves current exclusions for a project.

**Endpoint:** `GET /projects/{project_id}/exclusions`

**Authentication:** Required

**Path Parameters:**

- `project_id` (string) - MongoDB ObjectId of the project

**Response:** `200 OK`

```json
{
  "project_id": "507f1f77bcf86cd799439011",
  "excluded_directories": ["tests", "docs", "__pycache__"],
  "excluded_files": ["setup.py", "conftest.py", "test_*.py"]
}
```

**Error Responses:**

- `400 Bad Request` - Invalid project ID format
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot access other user's project
- `404 Not Found` - Project not found

---

### 8. Upload ZIP File

Uploads a ZIP file containing a project structure and processes Python files.

**Endpoint:** `POST /projects/{project_id}/upload-zip`

**Authentication:** Required

**Path Parameters:**

- `project_id` (string) - MongoDB ObjectId of the project

**Request Body:** (multipart/form-data)

- `zip_file` (file) - ZIP file containing project structure

**Response:** `200 OK`

```json
{
  "message": "Successfully uploaded and processed 10 files (7 Python files processed)",
  "processed_count": 7,
  "total_files": 10,
  "files": [
    {
      "id": "507f1f77bcf86cd799439013",
      "file_name": "main.py",
      "relative_path": "src/main.py",
      "size": 1024,
      "processed": true
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Invalid project ID, invalid file type, or file processing error
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Cannot upload to other user's project
- `404 Not Found` - Project not found

---

## Security Notes

1. **Project Ownership**: Users can only access/modify their own projects
2. **File Security**: Uploaded files are stored securely and validated
3. **Authorization**: All operations require valid authentication
4. **Input Validation**: All inputs are validated and sanitized

---

## Default Exclusions

When `use_default_exclusions=true`, the following patterns are automatically excluded:

**Default Excluded Directories:**

- `__pycache__`, `.git`, `.github`, `tests`, `test`, `docs`, `venv`, `.venv`, `env`, `node_modules`

**Default Excluded Files:**

- `setup.py`, `conftest.py`, `__init__.py`, `__main__.py`, `test_*.py`, `*_test.py`

---

## Error Handling

All errors follow this format:

```json
{
  "detail": "Error message description"
}
```

Common HTTP status codes:

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (validation errors)
- `500` - Internal Server Error

---

## Related APIs

- [Authentication API](./auth.md) - For login and token management
- [Users API](./users.md) - For user management
- [Files API](./files.md) - For individual file operations
