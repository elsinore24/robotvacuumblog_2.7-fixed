import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-start py-3 sm:items-center sm:h-16">
          <div className="flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="text-xl font-bold text-gray-900">Robot Vacuum Price</span>
              <span className="text-sm text-gray-600 mt-1 sm:mt-0 sm:ml-2">(Affiliate Links)</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end sm:flex-row sm:space-x-8 space-y-2 sm:space-y-0">
            <Link
              to="/blog"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                location.pathname.startsWith('/blog')
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Guides
            </Link>
            
            <Link
              to="/"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                location.pathname === '/'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Home className="h-4 w-4 mr-2" />
              Deals
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
