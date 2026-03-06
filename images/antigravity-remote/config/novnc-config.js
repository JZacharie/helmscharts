/*
 * noVNC custom configuration
 * Sets default language to English and optimizes input settings
 */
(function() {
    // Set default language to English
    if (!localStorage.getItem('language')) {
        localStorage.setItem('language', 'en');
    }
    
    // Optimize input settings for better text selection
    if (!localStorage.getItem('cursor')) {
        localStorage.setItem('cursor', 'true');  // Show local cursor
    }
    
    // Set resize mode to remote for better resolution matching
    if (!localStorage.getItem('resize')) {
        localStorage.setItem('resize', 'remote');
    }
    
    // Enable clipboard sharing
    if (!localStorage.getItem('clipboard')) {
        localStorage.setItem('clipboard', 'true');
    }
    
    console.log('noVNC custom config loaded - language set to English');
})();
