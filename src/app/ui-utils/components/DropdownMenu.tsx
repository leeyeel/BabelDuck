import React from 'react';

interface DropdownMenuProps {
    menuItems: { label: React.ReactNode; onClick: () => void }[];
}

export function DropdownMenu({ menuItems }: DropdownMenuProps) {
    return (
        <div className="absolute right-0 z-10 bg-white border rounded-xl p-2">
            {menuItems.map((item, index) => (
                <div
                    key={index}
                    className="p-2 cursor-pointer hover:bg-gray-100 rounded-md"
                    onClick={item.onClick}
                >
                    {item.label}
                </div>
            ))}
        </div>
    );
}
