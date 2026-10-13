const fs = require('fs');
const content = fs.readFileSync('./src/pages/AdminPanel.tsx', 'utf8');

// Find the Government Header Pattern comment
const headerIdx = content.indexOf('{/* Government Header Pattern - UX4G */}');
if (headerIdx === -1) {
  console.log('Government Header comment not found');
  process.exit(1);
}

// Build the new content
const before = content.substring(0, headerIdx);
const after = content.substring(headerIdx);

const newContent = before + 
`{error && !isLoading && (
        <div className="container mx-auto px-4 sm:px-6 mb-4">
          <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={refreshProjects} disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-1">
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                  {t('common.loading')}
                </span>
              ) : (
                t('common.retry')
              )}
            </Button>
          </div>
        </div>
      )}

      ` + after;

fs.writeFileSync('./src/pages/AdminPanel.tsx', newContent);
console.log('Done - replaced successfully');