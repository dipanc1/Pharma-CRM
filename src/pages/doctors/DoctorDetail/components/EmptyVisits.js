import React from 'react'
import { AddButton } from '../../../../components';
import { CalendarIcon } from '@heroicons/react/24/outline';

const EmptyVisits = () => (
  <div className="text-center py-8">
    <div className="text-gray-500">No visits recorded yet</div>
    <div className="inline-flex mt-4">
      <AddButton 
        title="Add First Visit" 
        link="/visits/add" 
        icon={<CalendarIcon className="h-4 w-4 mr-2" />} 
      />
    </div>
  </div>
);

export default EmptyVisits