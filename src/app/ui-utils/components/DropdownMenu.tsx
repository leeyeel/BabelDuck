import React from 'react';
import { FaChevronDown } from 'react-icons/fa';

interface DropdownMenuProps {
    menuItems: { label: React.ReactNode; onClick: () => void }[];
    className?: string;
}

export function DropdownMenu({ menuItems, className }: DropdownMenuProps) {
    return (
        <>
            <div className={`absolute z-50 bg-white border rounded-xl p-2 overflow-y-auto custom-scrollbar max-h-[300px] ${className}`}>
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
        </>
    );
}

export function DropdownMenuEntry({ label, onClick, className }: { label: React.ReactNode; onClick: () => void; className?: string }) {
    return <div className={`flex flex-row items-center p-2 pl-3 cursor-pointer hover:bg-gray-100 rounded-md ${className}`} onClick={onClick}>
        <div className="mr-2">{label}</div>
        <FaChevronDown size={12} />
    </div>
}