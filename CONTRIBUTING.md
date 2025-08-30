# Contributing to CloudBlueprint

Thank you for your interest in contributing to CloudBlueprint! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- A modern web browser
- Basic knowledge of Next.js, TypeScript, and Azure

### Local Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/yourusername/iac-scaffolder.git
   cd iac-scaffolder
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a local environment file:
   ```bash
   cp .env.example .env.local
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) to view the application

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── wizard/            # Wizard pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   └── theme-provider.tsx # Theme context
├── lib/                  # Utility functions
│   ├── naming.ts         # Naming service
│   ├── simple-templates.ts # Template generator
│   ├── utils.ts          # General utilities
│   └── zip-generator.ts  # ZIP file generation
└── types/                # TypeScript type definitions
    └── form.ts           # Form schemas and types
```

## 🎯 How to Contribute

### Types of Contributions

1. **Bug Reports**: Help us identify and fix issues
2. **Feature Requests**: Suggest new functionality
3. **Code Contributions**: Submit bug fixes or new features
4. **Documentation**: Improve docs, add examples, or fix typos
5. **Templates**: Add new Azure service templates or improve existing ones

### Development Workflow

1. **Create an Issue**: For bugs or feature requests, create an issue first to discuss
2. **Create a Branch**: Create a feature branch from main
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make Changes**: Implement your changes following our coding standards
4. **Test Locally**: Ensure the app builds and works correctly
5. **Commit Changes**: Use clear, descriptive commit messages
6. **Push and PR**: Push to your fork and create a pull request

### Coding Standards

#### TypeScript
- Use TypeScript for all new code
- Prefer type safety over `any`
- Use proper interfaces and types
- Follow existing naming conventions

#### React/Next.js
- Use functional components with hooks
- Follow Next.js App Router patterns
- Use proper TypeScript props interfaces
- Prefer server components when possible

#### Styling
- Use Tailwind CSS classes
- Follow existing design system patterns
- Ensure dark mode compatibility
- Test on mobile and desktop

#### File Organization
- Keep components focused and reusable
- Use proper import/export patterns
- Group related functionality
- Follow existing folder structure

### Template Development

When adding new Azure service templates:

1. **Research**: Ensure you're using Azure best practices
2. **AVM Integration**: Prefer Azure Verified Modules where available
3. **Naming**: Follow Azure CAF naming conventions
4. **Parameters**: Make templates configurable but with sensible defaults
5. **Documentation**: Include comments explaining complex logic
6. **Testing**: Test generated templates in Azure

#### Template Structure
```bicep
// Header with description
@description('...')
param name string

// Parameters with validation
@minLength(3)
@maxLength(24)
param storageAccountName string

// Resources
resource example 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  // Implementation
}

// Outputs
output id string = example.id
```

## 🐛 Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Detailed steps to reproduce the bug
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Screenshots**: If applicable
- **Environment**: Browser, OS, Node.js version
- **Error Messages**: Any console errors or stack traces

Use this template:

```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome 119
- OS: Windows 11
- Node.js: 18.17.0
```

## 💡 Feature Requests

For feature requests:

- **Use Case**: Explain why this feature would be valuable
- **Proposed Solution**: Describe your ideal solution
- **Alternatives**: Any alternative approaches you've considered
- **Implementation**: If you have ideas about implementation

## 🧪 Testing

### Manual Testing
- Test the wizard flow end-to-end
- Verify generated ZIP files contain correct structure
- Test dark/light mode switching
- Test on different screen sizes
- Validate generated Bicep templates

### Automated Testing
Currently, we have basic build testing. We welcome contributions for:
- Unit tests for utility functions
- Integration tests for template generation
- E2E tests for the wizard flow

## 📝 Documentation

When contributing documentation:

- Use clear, concise language
- Include code examples where helpful
- Keep README and docs up to date
- Add screenshots for UI changes
- Update any affected architecture diagrams

## 🔍 Code Review Process

1. **Automated Checks**: Ensure CI passes (build, lint, test)
2. **Manual Review**: Maintainers will review code for:
   - Functionality correctness
   - Code quality and standards
   - Security considerations
   - Performance implications
   - Documentation completeness

3. **Feedback**: Address any review comments
4. **Approval**: Once approved, maintainers will merge

## 🏷️ Commit Message Guidelines

Use clear, descriptive commit messages:

```
feat: add Key Vault template with RBAC support
fix: resolve naming validation for storage accounts
docs: update README with new features
refactor: simplify template generation logic
style: fix formatting in wizard components
test: add unit tests for naming service
```

## 📞 Getting Help

- **Issues**: Create an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check README and inline documentation

## 🎉 Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Special thanks in project documentation

Thank you for contributing to CloudBlueprint! 🙏
