package com.resume.shortlister.security;

import com.resume.shortlister.repository.RecruiterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final RecruiterRepository recruiterRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return recruiterRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Recruiter not found: " + email));
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(UUID id) throws UsernameNotFoundException {
        return recruiterRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Recruiter not found: " + id));
    }
}